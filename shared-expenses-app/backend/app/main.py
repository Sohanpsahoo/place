from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Shared Expenses API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import api

app.include_router(api.router, prefix="/api", tags=["api"])

@app.get("/")
def read_root():
    return {"message": "Shared Expenses API is running"}
