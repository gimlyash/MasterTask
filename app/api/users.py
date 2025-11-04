from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from app.models.user import User
from app.database.db import get_db
import hashlib

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password_hash: str
    preferences: dict | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    email: str | None = None
    password_hash: str | None = None
    preferences: dict | None = None

class PreferencesUpdate(BaseModel):
    preferences: dict
    
class UserResponse(BaseModel):
    user_id: int
    email: str
    created_at: datetime
    last_login: datetime | None
    preferences: dict | None

    model_config = ConfigDict(from_attributes=True)

@router.post("/login", response_model=UserResponse)
async def login_user(login: LoginRequest, db: Session = Depends(get_db)):
    """Авторизация пользователя по email и паролю"""
    try:
        # Находим пользователя по email
        db_user = db.query(User).filter(User.email == login.email).first()
        if not db_user:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # Хэшируем введенный пароль
        password_hash = hashlib.sha256(login.password.encode()).hexdigest()
        
        # Сравниваем хэши
        if db_user.password_hash != password_hash:
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        
        # Обновляем время последнего входа
        db_user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при входе: {str(e)}")

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        db_user = User(**user.model_dump())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.get("/", response_model=list[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        for key, value in user_update.model_dump(exclude_unset=True).items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@router.put("/{user_id}/preferences", response_model=UserResponse)
async def update_preferences(user_id: int, preferences_update: PreferencesUpdate, db: Session = Depends(get_db)):
    """Обновление настроек пользователя"""
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Объединяем существующие настройки с новыми (создаем новый словарь)
        # JSONB может быть dict или другим типом, поэтому конвертируем явно
        if user.preferences:
            if isinstance(user.preferences, dict):
                current_prefs = user.preferences.copy()
            else:
                current_prefs = dict(user.preferences)
        else:
            current_prefs = {}
        
        # Объединяем настройки
        new_prefs = {**current_prefs, **preferences_update.preferences}
        user.preferences = new_prefs
        
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")

@router.get("/{user_id}/preferences")
async def get_preferences(user_id: int, db: Session = Depends(get_db)):
    """Получение настроек пользователя"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"preferences": user.preferences or {}}

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(user)
        db.commit()
        return {"message": "User deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")