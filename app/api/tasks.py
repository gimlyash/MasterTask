from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from app.models.task import Task, PriorityEnum, StatusEnum
from app.database.db import get_db

router = APIRouter()

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    category_id: int | None = None
    priority: PriorityEnum | None = None
    deadline: datetime | None = None
    is_repeating: bool = False
    repeat_interval: str | None = None
    is_favorite: bool = False

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category_id: int | None = None
    priority: PriorityEnum | None = None
    deadline: datetime | None = None
    is_repeating: bool | None = None
    repeat_interval: str | None = None
    status: StatusEnum | None = None
    is_favorite: bool | None = None

class TaskResponse(BaseModel):
    task_id: int
    user_id: int
    title: str
    description: str | None
    category_id: int | None
    priority: PriorityEnum | None
    deadline: datetime | None
    is_repeating: bool
    repeat_interval: str | None
    status: StatusEnum | None
    is_favorite: bool
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, user_id: int = 1, db:
                      Session = Depends(get_db)):
    db_task = Task(
        user_id=user_id,
        title=task.title,
        description=task.description,
        category_id=task.category_id,
        priority=task.priority,
        deadline=task.deadline,
        is_repeating=task.is_repeating,
        repeat_interval=task.repeat_interval,
        status=StatusEnum.active,
        is_favorite=task.is_favorite
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=list[TaskResponse])
async def get_tasks(user_id: int = 1, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_update: TaskUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}