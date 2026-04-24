from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

def _validate_dob(v: str) -> str:
    try:
        datetime.strptime(v, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise ValueError("date_of_birth must be in YYYY-MM-DD format")
    return v

# ── Base Model ───────────────────────────────────────
class BaseRecord(BaseModel):
    id: Optional[str] = Field(None, description="Unique record identifier")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")

# ── Profile ──────────────────────────────────────────
class Profile(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    gender: str = Field(..., min_length=1, max_length=20)
    date_of_birth: str
    height_cm: float = Field(..., gt=0, le=300)
    current_weight_kg: float = Field(..., gt=0, le=500)
    target_weight_kg: float = Field(..., gt=0, le=500)

    @field_validator("date_of_birth")
    @classmethod
    def _dob(cls, v):
        return _validate_dob(v)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    gender: Optional[str] = Field(None, min_length=1, max_length=20)
    date_of_birth: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, le=300)
    current_weight_kg: Optional[float] = Field(None, gt=0, le=500)
    target_weight_kg: Optional[float] = Field(None, gt=0, le=500)

# ── Vitals ────────────────────────────────────────────
class Vitals(BaseRecord):
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    blood_pressure_systolic: Optional[int] = Field(None, ge=40, le=260)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=20, le=200)
    heart_rate_bpm: Optional[int] = Field(None, ge=20, le=300)
    notes: Optional[str] = Field(None, max_length=500)

# ── Mood ──────────────────────────────────────────────
class Mood(BaseRecord):
    score: int = Field(..., ge=1, le=10, description="Mood score from 1 to 10")
    description: str = Field(..., min_length=1, max_length=1000)
    tags: Optional[List[str]] = Field(default_factory=list)

# ── Medication ────────────────────────────────────────
class Medication(BaseRecord):
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., description="e.g. Twice a day")
    is_active: bool = Field(True)
