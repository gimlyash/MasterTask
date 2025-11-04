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
async def get_analytics_logs(user_id: int = None, db: Session = Depends(get_db)):
    query = db.query(AnalyticsLog)
    if user_id:
        query = query.filter(AnalyticsLog.user_id == user_id)
    return query.order_by(AnalyticsLog.timestamp.desc()).all()

@router.get("/{log_id}", response_model=AnalyticsLogResponse)
async def get_analytics_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(AnalyticsLog).filter(AnalyticsLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Analytics log not found")
    return log

@router.get("/stats/{user_id}")
async def get_analytics_stats(user_id: int, db: Session = Depends(get_db)):
    """Получение статистики по действиям пользователя"""
    from sqlalchemy import func
    from app.models.analytics_log import ActionEnum
    
    stats = db.query(
        AnalyticsLog.action,
        func.count(AnalyticsLog.log_id).label('count')
    ).filter(
        AnalyticsLog.user_id == user_id
    ).group_by(AnalyticsLog.action).all()
    
    result = {
        "user_id": user_id,
        "total_actions": sum(count for _, count in stats),
        "by_action": {
            action: count for action, count in stats
        }
    }
    
    return result