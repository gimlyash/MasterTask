from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone
import enum

Base = declarative_base()

class ActionEnum(str, enum.Enum):
    created = "created"
    completed = "completed"
    updated = "updated"

class AnalyticsLog(Base):
    __tablename__ = "analytics_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    details = Column(JSON)