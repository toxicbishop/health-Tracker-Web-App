import json
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Query

from ..models import Mood
from ..sheets import (
    append_row,
    delete_row,
    find_row_by_id,
    get_worksheet,
    sheet_to_records,
    update_row,
)

router = APIRouter(prefix="/mood", tags=["Mood Tracking"])
TAB = "mood"

@router.get("/", response_model=List[Mood])
def get_mood_history(sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    records = sheet_to_records(ws)
    # Deserialize tags if they are stored as JSON strings
    for r in records:
        if isinstance(r.get("tags"), str):
            try:
                r["tags"] = json.loads(r["tags"])
            except:
                r["tags"] = []
    return records

@router.post("/", status_code=201)
def record_mood(data: Mood, sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Store tags as JSON string for compatibility
    tags_json = json.dumps(data.tags or [])
    
    # Columns: id, timestamp, score, description, tags
    row = [record_id, now, data.score, data.description, tags_json]
    append_row(ws, row)
    return {"status": "success", "id": record_id}

@router.delete("/{record_id}")
def delete_mood(record_id: str, sheet_id: str = Query(...)):
    ws = get_worksheet(sheet_id, TAB)
    row_idx, _ = find_row_by_id(ws, record_id)
    if not row_idx:
        raise HTTPException(status_code=404, detail="Mood record not found")
    delete_row(ws, row_idx)
    return {"status": "success"}
