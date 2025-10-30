from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from app.models.task_tag import TaskTag
from app.database.db import get_db

router = APIRouter()

class TaskTagResponse(BaseModel):
    task_id: int
    tag_id: int

    model_config = ConfigDict(from_attributes=True)

@router.get("/", response_model=list[TaskTagResponse])
async def get_task_tags(db: Session = Depends(get_db)):
    return db.query(TaskTag).all()

@router.get("/{task_id}/{tag_id}", response_model=TaskTagResponse)
async def get_task_tag(task_id: int, tag_id: int, db: Session = Depends(get_db)):
    task_tag = db.query(TaskTag).filter(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id).first()
    if not task_tag:
        raise HTTPException(status_code=404, detail="Task-Tag association not found")
    return task_tag
