from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tasks, users, categories, tags, task_tags, notifications, analytics_logs
from app.database.db import Base, engine
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title= "MasterTask API",
    description= "REST API для управления задачами, пользователями, категориями и аналитикой",
    version= "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", tags=["root"])
async def root():
    return {"message": "MasterTask API is running. Visit /docs for Swagger UI"}