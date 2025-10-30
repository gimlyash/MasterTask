from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.notification import Notification, NotificationTypeEnum
from app.database.db import get_db

router = APIRouter()

class NotificationResponse(BaseModel):
    notification_id: int
    task_id: int
    user_id: int
    type: NotificationTypeEnum
    message: str
    sent_at: datetime
    is_read: bool

    model_config = ConfigDict(from_attributes=True)

@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).all()

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification