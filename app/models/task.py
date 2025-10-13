from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone
import enum

Base = declarative_base()

class StatusEnum(str, enum.Enum):
    active = "active"
    in_progress = "in_progress"
    comleted = "completed"
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