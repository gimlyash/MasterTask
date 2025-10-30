from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum
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
    user_id = Column(Integer, ForeignKey("users.user_id"))
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    action = Column(Enum(ActionEnum))
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    details = Column(JSON)