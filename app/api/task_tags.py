from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from app.models.task_tag import TaskTag
from app.models.task import Task
from app.models.tag import Tag
from app.database.db import get_db

router = APIRouter()

class TaskTagCreate(BaseModel):
    task_id: int
    tag_id: int

class TaskTagResponse(BaseModel):
    task_id: int
    tag_id: int

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=TaskTagResponse)
async def create_task_tag(task_tag: TaskTagCreate, db: Session = Depends(get_db)):
    try:
        # Проверяем существование задачи и тега
        task = db.query(Task).filter(Task.task_id == task_tag.task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        tag = db.query(Tag).filter(Tag.tag_id == task_tag.tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Проверяем, не существует ли уже такая связь
        existing = db.query(TaskTag).filter(
            TaskTag.task_id == task_tag.task_id,
            TaskTag.tag_id == task_tag.tag_id
        ).first()
        if existing:
            return existing
        
        db_task_tag = TaskTag(task_id=task_tag.task_id, tag_id=task_tag.tag_id)
        db.add(db_task_tag)
        db.commit()
        db.refresh(db_task_tag)
        return db_task_tag
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task-tag association: {str(e)}")

@router.get("/", response_model=list[TaskTagResponse])
async def get_task_tags(task_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(TaskTag)
    if task_id:
        query = query.filter(TaskTag.task_id == task_id)
    return query.all()

@router.get("/{task_id}/{tag_id}", response_model=TaskTagResponse)
async def get_task_tag(task_id: int, tag_id: int, db: Session = Depends(get_db)):
    task_tag = db.query(TaskTag).filter(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id).first()
    if not task_tag:
        raise HTTPException(status_code=404, detail="Task-Tag association not found")
    return task_tag

@router.delete("/{task_id}/{tag_id}")
async def delete_task_tag(task_id: int, tag_id: int, db: Session = Depends(get_db)):
    try:
        task_tag = db.query(TaskTag).filter(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id).first()
        if not task_tag:
            raise HTTPException(status_code=404, detail="Task-Tag association not found")
        db.delete(task_tag)
        db.commit()
        return {"message": "Task-Tag association deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task-tag association: {str(e)}")
