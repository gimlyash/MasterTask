from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timezone
from app.models.task import Task, PriorityEnum, StatusEnum
from app.models.analytics_log import AnalyticsLog, ActionEnum
from app.models.tag import Tag
from app.models.task_tag import TaskTag
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

class TagInfo(BaseModel):
    tag_id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)

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
    tags: list[TagInfo] = []

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_orm_with_tags(cls, task: Task, db: Session):
        """Создает TaskResponse с загруженными тегами"""
        task_tags = db.query(TaskTag).filter(TaskTag.task_id == task.task_id).all()
        tags = []
        for task_tag in task_tags:
            tag = db.query(Tag).filter(Tag.tag_id == task_tag.tag_id).first()
            if tag:
                tags.append(TagInfo(tag_id=tag.tag_id, name=tag.name))
        
        task_dict = {
            "task_id": task.task_id,
            "user_id": task.user_id,
            "title": task.title,
            "description": task.description,
            "category_id": task.category_id,
            "priority": task.priority,
            "deadline": task.deadline,
            "is_repeating": task.is_repeating,
            "repeat_interval": task.repeat_interval,
            "status": task.status,
            "is_favorite": task.is_favorite,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "completed_at": task.completed_at,
            "tags": tags
        }
        return cls(**task_dict)

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, user_id: int = 1, db:
                      Session = Depends(get_db)):
    try:
        # Проверка существования пользователя
        from app.models.user import User
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Проверка существования категории, если указана
        if task.category_id:
            from app.models.category import Category
            category = db.query(Category).filter(Category.category_id == task.category_id).first()
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
        
        db_task = Task(
            user_id=user_id,
            title=task.title,
            description=task.description,
            category_id=task.category_id,
            priority=task.priority.value if task.priority else None,
            deadline=task.deadline,
            is_repeating=task.is_repeating,
            repeat_interval=task.repeat_interval,
            status=StatusEnum.active.value,
            is_favorite=task.is_favorite
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        
        # Уведомление о просрочке создается автоматически триггером БД
        
        # Создание аналитического лога
        analytics_log = AnalyticsLog(
            user_id=user_id,
            task_id=db_task.task_id,
            action=ActionEnum.created.value,
            details={"title": db_task.title, "priority": db_task.priority, "deadline": str(db_task.deadline) if db_task.deadline else None}
        )
        db.add(analytics_log)
        db.commit()
        
        return TaskResponse.from_orm_with_tags(db_task, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.get("/", response_model=list[TaskResponse])
async def get_tasks(user_id: int = 1, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    return [TaskResponse.from_orm_with_tags(task, db) for task in tasks]

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm_with_tags(task, db)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_update: TaskUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    try:
        task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Проверка существования категории, если указана
        if task_update.category_id is not None:
            from app.models.category import Category
            category = db.query(Category).filter(Category.category_id == task_update.category_id).first()
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
        
        old_status = task.status
        for key, value in task_update.model_dump(exclude_unset=True).items():
            # Преобразуем Enum в строку для сохранения в БД
            if key in ('priority', 'status') and value is not None:
                value = value.value if hasattr(value, 'value') else value
            setattr(task, key, value)
        
        # Устанавливаем completed_at при выполнении задачи
        if task_update.status and task.status == StatusEnum.completed.value and old_status != StatusEnum.completed.value:
            task.completed_at = datetime.now(timezone.utc)
        # Сбрасываем completed_at при отмене выполнения
        elif task_update.status and task.status != StatusEnum.completed.value and old_status == StatusEnum.completed.value:
            task.completed_at = None
        
        task.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(task)
        
        # Уведомление о просрочке создается автоматически триггером БД
        
        # Определяем тип действия для аналитики
        action_type = ActionEnum.updated
        if task_update.status and task.status == StatusEnum.completed.value and old_status != StatusEnum.completed.value:
            action_type = ActionEnum.completed
        
        # Создание аналитического лога
        analytics_log = AnalyticsLog(
            user_id=user_id,
            task_id=task.task_id,
            action=action_type.value,
            details={
                "updated_fields": list(task_update.model_dump(exclude_unset=True).keys()),
                "old_status": old_status,
                "new_status": task.status
            }
        )
        db.add(analytics_log)
        db.commit()
        
        return TaskResponse.from_orm_with_tags(task, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(task_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    try:
        task = db.query(Task).filter(Task.task_id == task_id, Task.user_id == user_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
        return {"message": "Task deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")