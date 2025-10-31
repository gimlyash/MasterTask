from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, CheckConstraint
from datetime import datetime, timezone
import enum
from app.database.db import Base

class NotificationTypeEnum(str, enum.Enum):
    overdue = "overdue"
    reminder = "reminder"

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    type = Column(String(20))
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.now(timezone.utc))
    is_read = Column(Boolean, default=False)
    
    __table_args__ = (
        CheckConstraint("type IN ('overdue', 'reminder')", name='check_notification_type'),
    )