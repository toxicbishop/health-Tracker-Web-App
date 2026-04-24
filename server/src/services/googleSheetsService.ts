import { google } from "googleapis";
import { HealthLog, ParameterType } from "../types/health";
import dotenv from "dotenv";

dotenv.config();

class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    const keyData = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || "";

    if (!keyData || !this.spreadsheetId) {
      console.warn(
        "[GoogleSheetsService]: Missing credentials or Spreadsheet ID in .env",
      );
      return;
    }

    try {
      // Parse the service account key from the environment variable
      const credentials = JSON.parse(keyData);

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error("[GoogleSheetsService]: Initialization Error:", error);
    }
  }

  /**
   * Appends a health log to the spreadsheet
   */
  async appendLog(log: HealthLog): Promise<void> {
    if (!this.sheets) {
      console.error("[GoogleSheetsService]: Sheets client not initialized");
      return;
    }

    try {
      // Map the log object to a row array
      // Columns: Timestamp, UserID, Type, Weight, Systolic, Diastolic, Unit, Notes
      const values = this.mapLogToRow(log).map((val) => {
        if (
          typeof val === "string" &&
          (val.startsWith("=") ||
            val.startsWith("+") ||
            val.startsWith("-") ||
            val.startsWith("@"))
        ) {
          return `'${val}`;
        }
        return val;
      });

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "Sheet1!A:H",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [values],
        },
      });

      console.log(
        `[GoogleSheetsService]: Successfully appended log for ${log.userId} (${log.type})`,
      );
    } catch (error) {
      console.error("[GoogleSheetsService]: Append Error:", error);
      throw new Error("Failed to save data to Google Sheets");
    }
  }

  /**
   * Retrieves health logs for a specific user from the spreadsheet
   */
  async getLogs(userId: string): Promise<HealthLog[]> {
    if (!this.sheets) {
      console.error("[GoogleSheetsService]: Sheets client not initialized");
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Sheet1!A:H",
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];

      const logs: HealthLog[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Structure: Timestamp | UserID | Type | Weight | Systolic | Diastolic | Unit | Notes
        const [timestamp, rowUserId, type, weight, systolic, diastolic, unit, notes] = row;

        if (rowUserId === userId) {
          let logObj: any = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp,
            userId: rowUserId,
            type: type as ParameterType,
            notes: notes || "",
          };

          if (type === ParameterType.WEIGHT) {
            logObj.weight = parseFloat(weight);
            logObj.unit = unit;
          } else if (type === ParameterType.BLOOD_PRESSURE) {
            logObj.systolic = parseInt(systolic, 10);
            logObj.diastolic = parseInt(diastolic, 10);
          } else if (type === ParameterType.HEART_RATE) {
            logObj.bpm = parseInt(weight, 10); // Reusing weight col for single value
          } else if (type === ParameterType.BOTH) {
            logObj.weight = parseFloat(weight);
            logObj.systolic = parseInt(systolic, 10);
            logObj.diastolic = parseInt(diastolic, 10);
            logObj.unit = unit;
          }
          logs.push(logObj as HealthLog);
        }
      }

      return logs;
    } catch (error) {
      console.error("[GoogleSheetsService]: Get Logs Error:", error);
      throw new Error("Failed to retrieve data from Google Sheets");
    }
  }

  private mapLogToRow(log: HealthLog): any[] {
    const { timestamp, userId, type, notes = "" } = log;
    let weight: any = "";
    let systolic: any = "";
    let diastolic: any = "";
    let unit: string = "";

    switch (log.type) {
      case ParameterType.WEIGHT:
        weight = log.weight;
        unit = log.unit;
        break;
      case ParameterType.BLOOD_PRESSURE:
        systolic = log.systolic;
        diastolic = log.diastolic;
        unit = "mmHg";
        break;
      case ParameterType.HEART_RATE:
        weight = log.bpm;
        unit = "bpm";
        break;
      case ParameterType.BOTH:
        weight = log.weight;
        systolic = log.systolic;
        diastolic = log.diastolic;
        unit = log.unit;
        break;
    }

    // Timestamp | UserID | Type | Weight | Systolic | Diastolic | Unit | Notes
    return [timestamp, userId, type, weight, systolic, diastolic, unit, notes];
  }
}

export const googleSheetsService = new GoogleSheetsService();
