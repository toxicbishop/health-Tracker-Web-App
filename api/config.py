from dotenv import load_dotenv
import os
from pathlib import Path

_MODULE_DIR = Path(__file__).resolve().parent
load_dotenv(_MODULE_DIR / ".env")

_raw = os.getenv("CREDENTIALS_FILE", "credentials.json")
_path = Path(_raw)
CREDENTIALS_FILE = str(_path if _path.is_absolute() else _MODULE_DIR / _path)

TAB_HEADERS = {
    "profile": [
        "full_name",
        "gender",
        "date_of_birth",
        "height_cm",
        "current_weight_kg",
        "target_weight_kg",
        "updated_at",
    ],
    "vitals": [
        "id",
        "timestamp",
        "weight_kg",
        "blood_pressure_systolic",
        "blood_pressure_diastolic",
        "heart_rate_bpm",
        "notes",
    ],
    "mood": [
        "id",
        "timestamp",
        "score",
        "description",
        "tags",
    ],
    "medication": [
        "id",
        "timestamp",
        "name",
        "dosage",
        "frequency",
        "is_active",
    ],
}
