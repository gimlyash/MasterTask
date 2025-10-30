from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import Base, engine

from app.models.user import User 
from app.models.category import Category   
from app.models.task import Task       
from app.models.tag import Tag
from app.models.task_tag import TaskTag
from app.models.analytics_log import AnalyticsLog
from app.models.notification import Notification

from app.api import tasks, users, categories, tags, task_tags, notifications, analytics_logs

app = FastAPI(
    title= "MasterTask API",
    description= "REST API для управления задачами, пользователями, категориями и аналитикой",
    version= "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(task_tags.router, prefix="/task-tags", tags=["task_tags"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(analytics_logs.router, prefix="/analytics-logs", tags=["analytics_logs"])

@app.get("/api/hello")
def hello():
    return {"message": "Привет от FastAPI!"}

@app.get("/", tags=["root"])
async def root():
    return {"message": "MasterTask API is running. Visit /docs for Swagger UI"}