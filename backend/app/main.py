from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.routers.root import api_router
from .core.config import get_settings
from .db.session import Base, engine

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.on_event("startup")
def on_startup():
    # Create tables for SQLite dev runs
    Base.metadata.create_all(bind=engine)


