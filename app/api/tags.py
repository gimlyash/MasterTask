from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.models.tag import Tag
from app.database.db import get_db

router = APIRouter()

class TagResponse(BaseModel):
    tag_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=list[TagResponse])
async def get_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()

@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.tag_id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag