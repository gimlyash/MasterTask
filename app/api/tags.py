from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.tag import Tag
from app.database.db import get_db

router = APIRouter()

class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    tag_id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=TagResponse)
async def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    try:
        # Нормализуем имя тега (убираем пробелы и приводим к нижнему регистру)
        normalized_name = tag.name.strip().lower()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="Tag name cannot be empty")
        
        # Проверяем, существует ли тег с таким именем (case-insensitive)
        existing_tag = db.query(Tag).filter(Tag.name == normalized_name).first()
        if existing_tag:
            return existing_tag
        
        db_tag = Tag(name=normalized_name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating tag: {str(e)}")

@router.get("/", response_model=list[TagResponse])
async def get_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()

@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag