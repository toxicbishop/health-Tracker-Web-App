export type ParameterType =
  | "WEIGHT"
  | "BLOOD_PRESSURE"
  | "HEART_RATE"
  | "BLOOD_SUGAR"
  | "SLEEP"
  | "BOTH";

export interface BaseHealthLog {
  id?: string;
  userId: string;
  timestamp: string;
  type: ParameterType;
  notes?: string;
}

export interface WeightLog extends BaseHealthLog {
  type: "WEIGHT";
  weight: number;
  unit: "kg" | "lbs";
}

export interface BPLog extends BaseHealthLog {
  type: "BLOOD_PRESSURE";
  systolic: number;
  diastolic: number;
}

export interface HeartRateLog extends BaseHealthLog {
  type: "HEART_RATE";
  bpm: number;
}

export interface BothLog extends BaseHealthLog {
  type: "BOTH";
  weight: number;
  unit: "kg" | "lbs";
  systolic: number;
  diastolic: number;
}

export type HealthLog = WeightLog | BPLog | HeartRateLog | BothLog;
