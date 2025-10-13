from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone
import enum

Base = declarative_base()

class NotificationTypeEnum(str, enum.Enum):
    overdue = "overdue"
    reminder = "reminder"

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    type = Column(Enum(NotificationTypeEnum))
    message = Column(String, nullable=False)
    sent_at = Column(DateTime, default=datetime.now(timezone.utc))
    is_read = Column(Boolean, default=False)