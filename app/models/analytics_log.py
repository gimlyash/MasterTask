from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
import enum
from app.database.db import Base

class ActionEnum(str, enum.Enum):
    created = "created"
    completed = "completed"
    updated = "updated"

class AnalyticsLog(Base):
    __tablename__ = "analytics_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="CASCADE"))
    action = Column(String(20))
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    details = Column(JSONB)
    
    __table_args__ = (
        CheckConstraint("action IN ('created', 'completed', 'updated')", name='check_action'),
    )