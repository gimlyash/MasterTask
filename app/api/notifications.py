from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.notification import Notification, NotificationTypeEnum
from app.database.db import get_db

router = APIRouter()

class NotificationCreate(BaseModel):
    task_id: int
    user_id: int
    type: NotificationTypeEnum
    message: str

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(BaseModel):
    notification_id: int
    task_id: int
    user_id: int
    type: NotificationTypeEnum
    message: str
    sent_at: datetime
    is_read: bool

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=NotificationResponse)
async def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    try:
        db_notification = Notification(**notification.model_dump())
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating notification: {str(e)}")

@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(user_id: int = None, is_read: bool = None, db: Session = Depends(get_db)):
    query = db.query(Notification)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    return query.order_by(Notification.sent_at.desc()).all()

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(notification_id: int, notification_update: NotificationUpdate, db: Session = Depends(get_db)):
    try:
        notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        for key, value in notification_update.model_dump(exclude_unset=True).items():
            setattr(notification, key, value)
        
        db.commit()
        db.refresh(notification)
        return notification
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating notification: {str(e)}")

@router.delete("/{notification_id}")
async def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    try:
        notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        db.delete(notification)
        db.commit()
        return {"message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")