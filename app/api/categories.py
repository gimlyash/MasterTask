from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.category import Category
from app.database.db import get_db

router = APIRouter()

class CategoryCreate(BaseModel):
    user_id: int
    name: str
    color: str | None = None

class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

class CategoryResponse(BaseModel):
    category_id: int
    user_id: int
    name: str
    color: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    try:
        # Проверка существования пользователя
        from app.models.user import User
        user = db.query(User).filter(User.user_id == category.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Проверка уникальности имени категории для пользователя
        existing = db.query(Category).filter(
            Category.user_id == category.user_id,
            Category.name == category.name
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category with this name already exists for this user")
        
        db_category = Category(**category.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating category: {str(e)}")

@router.get("/", response_model=list[CategoryResponse])
async def get_categories(user_id: int = None, db: Session = Depends(get_db)):
    if user_id:
        return db.query(Category).filter(Category.user_id == user_id).all()
    return db.query(Category).all()

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.category_id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: int, category_update: CategoryUpdate, db: Session = Depends(get_db)):
    try:
        category = db.query(Category).filter(Category.category_id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Проверка уникальности имени при обновлении
        if category_update.name and category_update.name != category.name:
            existing = db.query(Category).filter(
                Category.user_id == category.user_id,
                Category.name == category_update.name
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Category with this name already exists for this user")
        
        for key, value in category_update.model_dump(exclude_unset=True).items():
            setattr(category, key, value)
        db.commit()
        db.refresh(category)
        return category
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating category: {str(e)}")

@router.delete("/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    try:
        category = db.query(Category).filter(Category.category_id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        db.delete(category)
        db.commit()
        return {"message": "Category deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting category: {str(e)}")