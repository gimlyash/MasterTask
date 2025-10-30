from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database.db import Base
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    tasks = relationship("Task", back_populates="category")
