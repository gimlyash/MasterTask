from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class TaskTag(Base):
    __tablename__ = "task_tags"
    task_id = Column(Integer, ForeignKey("tasks.task_id"), 
                    primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.tag_id"), 
                    primary_key=True)