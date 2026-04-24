import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any, Tuple, Optional
from .config import CREDENTIALS_FILE, TAB_HEADERS

# Scopes required for Google Sheets and Drive
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def get_client():
    """Initialize and return a gspread client."""
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    return gspread.authorize(creds)

def get_worksheet(sheet_id: str, tab_name: str):
    """Open a spreadsheet and return a specific worksheet."""
    client = get_client()
    spreadsheet = client.open_by_key(sheet_id)
    try:
        return spreadsheet.worksheet(tab_name)
    except gspread.exceptions.WorksheetNotFound:
        # Create worksheet if it doesn't exist
        headers = TAB_HEADERS.get(tab_name, [])
        worksheet = spreadsheet.add_worksheet(title=tab_name, rows="100", cols=str(len(headers)))
        if headers:
            worksheet.append_row(headers)
        return worksheet

def sheet_to_records(worksheet) -> List[Dict[str, Any]]:
    """Convert worksheet rows to a list of dictionaries."""
    return worksheet.get_all_records()

def append_row(worksheet, row: List[Any]):
    """Append a new row to the worksheet."""
    return worksheet.append_row(row)

def find_row_by_id(worksheet, record_id: str) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    """Find a row index and its data by record ID."""
    records = worksheet.get_all_records()
    for i, record in enumerate(records):
        if str(record.get("id")) == record_id:
            # gspread is 1-indexed, and we skip header row (+2)
            return i + 2, record
    return None, None

def update_row(worksheet, row_index: int, data: Dict[str, Any]):
    """Update specific columns in a row."""
    # This is a bit complex with gspread if we want to update specific cells
    # For simplicity, we get the row, update the dict, and write it back
    headers = worksheet.row_values(1)
    row_values = worksheet.row_values(row_index)
    
    # Create a full row map
    record = dict(zip(headers, row_values))
    record.update(data)
    
    # Map back to ordered list
    new_values = [record.get(h, "") for h in headers]
    
    # Update the range
    cell_range = f"A{row_index}:{gspread.utils.rowcol_to_a1(row_index, len(headers))}"
    worksheet.update(cell_range, [new_values])

def delete_row(worksheet, row_index: int):
    """Delete a row from the worksheet."""
    return worksheet.delete_rows(row_index)
