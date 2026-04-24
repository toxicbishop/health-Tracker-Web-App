export enum ParameterType {
  WEIGHT = "WEIGHT",
  BLOOD_PRESSURE = "BLOOD_PRESSURE",
  HEART_RATE = "HEART_RATE",
  BLOOD_SUGAR = "BLOOD_SUGAR",
  SLEEP = "SLEEP",
  BOTH = "BOTH",
}

export interface BaseHealthLog {
  id?: string;
  userId: string;
  timestamp: string;
  type: ParameterType;
  notes?: string;
}

export interface WeightLog extends BaseHealthLog {
  type: ParameterType.WEIGHT;
  weight: number; // in kg
  unit: "kg" | "lbs";
}

export interface BPLog extends BaseHealthLog {
  type: ParameterType.BLOOD_PRESSURE;
  systolic: number;
  diastolic: number;
}

export interface HeartRateLog extends BaseHealthLog {
  type: ParameterType.HEART_RATE;
  bpm: number;
}

export interface BothLog extends BaseHealthLog {
  type: ParameterType.BOTH;
  weight: number;
  unit: "kg" | "lbs";
  systolic: number;
  diastolic: number;
}

export type HealthLog = WeightLog | BPLog | HeartRateLog | BothLog;
