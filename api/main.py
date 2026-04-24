from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import vitals, profile, mood, medication

app = FastAPI(
    title="Mom's Health Tracker API",
    description="A premium, clinical-grade health tracking system for monitoring vitals, medications, and wellbeing.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──────────────────────────────────────────────
app.include_router(profile.router)
app.include_router(vitals.router)
app.include_router(mood.router)
app.include_router(medication.router)

@app.get("/")
def root():
    return {
        "app": "Mom's Health Tracker API",
        "status": "online",
        "documentation": "/docs"
    }
