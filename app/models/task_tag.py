from sqlalchemy import Column, Integer, ForeignKey
from app.database.db import Base
from sqlalchemy.orm import relationship

class TaskTag(Base):
    __tablename__ = "task_tags"
    task_id = Column(Integer, ForeignKey("tasks.task_id"), 
                    primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.tag_id"), 
                    primary_key=True)
    
    task = relationship("Task", back_populates="tags")
    tag = relationship("Tag", back_populates="tasks")