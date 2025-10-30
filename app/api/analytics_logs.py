from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.analytics_log import AnalyticsLog, ActionEnum
from app.database.db import get_db

router = APIRouter()

class AnalyticsLogResponse(BaseModel):
    log_id: int
    user_id: int
    task_id: int
    action: ActionEnum
    timestamp: datetime
    details: dict | None

    model_config = ConfigDict(from_attributes=True)

@router.get("/", response_model=list[AnalyticsLogResponse])
async def get_analytics_logs(db: Session = Depends(get_db)):
    return db.query(AnalyticsLog).all()

@router.get("/{log_id}", response_model=AnalyticsLogResponse)
async def get_analytics_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(AnalyticsLog).filter(AnalyticsLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Analytics log not found")
    return log