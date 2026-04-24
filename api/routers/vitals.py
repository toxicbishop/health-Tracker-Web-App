import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Query

from ..models import Vitals
from ..sheets import (
    append_row,
    delete_row,
    find_row_by_id,
    get_worksheet,
    sheet_to_records,
    update_row,
)

router = APIRouter(prefix="/vitals", tags=["Health Vitals"])
TAB = "vitals"

@router.get("/", response_model=List[Vitals])
def get_all_vitals(sheet_id: str = Query(..., description="Google Sheet ID")):
    """Retrieve all vitals history for a user."""
    ws = get_worksheet(sheet_id, TAB)
    return sheet_to_records(ws)

@router.post("/", status_code=201)
def create_vital(data: Vitals, sheet_id: str = Query(...)):
    """Record new vitals (Weight, BP, Heart Rate)."""
    ws = get_worksheet(sheet_id, TAB)
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Columns: id, timestamp, weight_kg, bp_systolic, bp_diastolic, heart_rate_bpm, notes
    row = [
        record_id,
        now,
        data.weight_kg,
        data.blood_pressure_systolic,
        data.blood_pressure_diastolic,
        data.heart_rate_bpm,
        data.notes
    ]
    append_row(ws, row)
    return {"status": "success", "message": "Vital record added", "id": record_id}

@router.put("/{record_id}")
def update_vital(record_id: str, data: Vitals, sheet_id: str = Query(...)):
    """Update an existing vital record."""
    ws = get_worksheet(sheet_id, TAB)
    row_index, record = find_row_by_id(ws, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = data.model_dump(exclude_unset=True)
    update_row(ws, row_index, update_data)
    return {"status": "success", "message": "Vital record updated"}

@router.delete("/{record_id}")
def delete_vital(record_id: str, sheet_id: str = Query(...)):
    """Remove a vital record."""
    ws = get_worksheet(sheet_id, TAB)
    row_index, record = find_row_by_id(ws, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    delete_row(ws, row_index)
    return {"status": "success", "message": "Vital record deleted"}
