from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime, timezone
from app.database.db import Base
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='unique_category_name_per_user'),
    )
    
    tasks = relationship("Task", back_populates="category")
