from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..models import Profile, ProfileUpdate
from ..sheets import (
    get_worksheet,
    sheet_to_records,
    update_row,
)

router = APIRouter(prefix="/profile", tags=["User Profile"])
TAB = "profile"

@router.get("/", response_model=Optional[Profile])
def get_profile(sheet_id: str = Query(...)):
    """Retrieve the primary user profile from the sheet."""
    ws = get_worksheet(sheet_id, TAB)
    records = sheet_to_records(ws)
    if not records:
        return None
    return records[0]

@router.put("/")
def update_profile(data: Profile, sheet_id: str = Query(...)):
    """Overwrite the profile record."""
    ws = get_worksheet(sheet_id, TAB)
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = data.model_dump()
    update_data["updated_at"] = now
    
    # Profile is always the first data row (index 2)
    update_row(ws, 2, update_data)
    return {"status": "success", "message": "Profile updated"}

@router.patch("/")
def patch_profile(data: ProfileUpdate, sheet_id: str = Query(...)):
    """Partially update the profile record."""
    ws = get_worksheet(sheet_id, TAB)
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = data.model_dump(exclude_unset=True)
    update_data["updated_at"] = now
    
    update_row(ws, 2, update_data)
    return {"status": "success", "message": "Profile patched"}
