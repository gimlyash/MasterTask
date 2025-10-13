from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tasks
from app.database.db import Base, engine

app = FastAPI(title="MasterTask API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])

@app.get("/")
async def root():
    return {"message": "MasterTask API"}