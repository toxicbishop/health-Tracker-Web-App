/**
 * Google Apps Script Web App for Health Tracker App.
 * Persists health records directly to a Google Sheet.
 */

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var payload = JSON.parse(e.postData.contents);
    
    var timestamp = payload.timestamp || new Date().toISOString();
    var userId = payload.userId || payload.userName || "anonymous";
    var type = payload.type || "WEIGHT";
    var notes = payload.notes || "";
    
    var weight = "";
    var systolic = "";
    var diastolic = "";
    var unit = "";
    
    if (type === "WEIGHT") {
      weight = payload.weight || "";
      unit = payload.unit || "kg";
    } else if (type === "BLOOD_PRESSURE") {
      systolic = payload.systolic || "";
      diastolic = payload.diastolic || "";
      unit = "mmHg";
    } else if (type === "HEART_RATE") {
      weight = payload.bpm || "";
      unit = "bpm";
    } else if (type === "BOTH") {
      weight = payload.weight || "";
      systolic = payload.systolic || "";
      diastolic = payload.diastolic || "";
      unit = payload.unit || "kg";
    }
    
    // Columns: Timestamp | UserID | Type | Weight | Systolic | Diastolic | Unit | Notes
    var row = [timestamp, userId, type, weight, systolic, diastolic, unit, notes];
    sheet.appendRow(row);
    
    var result = {
      status: "success",
      data: {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timestamp,
        userId: userId,
        type: type,
        notes: notes,
        weight: weight !== "" ? parseFloat(weight) : null,
        systolic: systolic !== "" ? parseInt(systolic, 10) : null,
        diastolic: diastolic !== "" ? parseInt(diastolic, 10) : null,
        bpm: type === "HEART_RATE" && weight !== "" ? parseInt(weight, 10) : null,
        unit: unit
      }
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    var errorResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var userId = e.parameter.userId || e.parameter.userName;
    
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing userId or userName parameter"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    
    var logs = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowUserId = String(row[1]);
      
      if (rowUserId === userId) {
        var timestamp = row[0];
        var type = row[2];
        var weight = row[3];
        var systolic = row[4];
        var diastolic = row[5];
        var unit = row[6];
        var notes = row[7];
        
        var logObj = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: timestamp,
          userId: rowUserId,
          type: type,
          notes: notes || ""
        };
        
        if (type === "WEIGHT") {
          logObj.weight = weight !== "" ? parseFloat(weight) : null;
          logObj.unit = unit;
        } else if (type === "BLOOD_PRESSURE") {
          logObj.systolic = systolic !== "" ? parseInt(systolic, 10) : null;
          logObj.diastolic = diastolic !== "" ? parseInt(diastolic, 10) : null;
          logObj.unit = unit;
        } else if (type === "HEART_RATE") {
          logObj.bpm = weight !== "" ? parseInt(weight, 10) : null;
          logObj.unit = unit;
        } else if (type === "BOTH") {
          logObj.weight = weight !== "" ? parseFloat(weight) : null;
          logObj.systolic = systolic !== "" ? parseInt(systolic, 10) : null;
          logObj.diastolic = diastolic !== "" ? parseInt(diastolic, 10) : null;
          logObj.unit = unit;
        }
        
        logs.push(logObj);
      }
    }
    
    // Sort logs descending by timestamp
    logs.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return ContentService.createTextOutput(JSON.stringify(logs))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");
  if (!sheet) {
    sheet = ss.insertSheet("Sheet1");
  }
  
  // If headers are missing, write them
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "UserID", "Type", "Weight", "Systolic", "Diastolic", "Unit", "Notes"]);
  }
  
  return sheet;
}
