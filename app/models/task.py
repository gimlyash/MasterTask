from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Text
from datetime import datetime, timezone
import enum
from app.database.db import Base
from sqlalchemy.orm import relationship

class StatusEnum(str, enum.Enum):
    active = "active"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"

class PriorityEnum(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class Task(Base):
    __tablename__ = "tasks"
    task_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="SET NULL"))
    priority = Column(Enum(PriorityEnum))
    deadline = Column(DateTime)
    is_repeating = Column(Boolean, default=False)
    repeat_interval = Column(String(50))
    status = Column(Enum(StatusEnum))
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc))
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")
    tags = relationship("TaskTag", back_populates="task")