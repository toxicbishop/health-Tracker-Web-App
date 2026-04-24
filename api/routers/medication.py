import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Query

from ..models import Medication
from ..sheets import (
    append_row,
    delete_row,
    find_row_by_id,
    get_worksheet,
    sheet_to_records,
    update_row,
)

router = APIRouter(prefix="/medication", tags=["Medications"])
TAB = "medication"

@router.get("/", response_model=List[Medication])
def get_medications(sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    return sheet_to_records(ws)

@router.post("/", status_code=201)
def add_medication(data: Medication, sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Columns: id, timestamp, name, dosage, frequency, is_active
    row = [record_id, now, data.name, data.dosage, data.frequency, data.is_active]
    append_row(ws, row)
    return {"status": "success", "id": record_id}

@router.patch("/{record_id}/toggle")
def toggle_medication(record_id: str, sheet_id: str = Query(...)):
    """Toggle medication active/inactive status."""
    ws = get_worksheet(sheet_id, TAB)
    row_idx, record = find_row_by_id(ws, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Toggle the boolean (check for string "TRUE"/"FALSE" from sheets)
    current_status = str(record.get("is_active", "true")).lower() == "true"
    new_status = not current_status
    
    update_row(ws, row_idx, {"is_active": new_status})
    return {"status": "success", "new_status": new_status}

@router.delete("/{record_id}")
def delete_medication(record_id: str, sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    row_idx, _ = find_row_by_id(ws, record_id)
    if not row_idx:
        raise HTTPException(status_code=404, detail="Medication not found")
    delete_row(ws, row_idx)
    return {"status": "success"}
