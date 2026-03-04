import React, { useState } from "react";
import { healthApi } from "../api/health";
import {
  Scale,
  Activity,
  HeartPulse,
  CheckCircle,
  AlertCircle,
  StickyNote,
} from "lucide-react";

type LogType = "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

interface TypeOption {
  value: LogType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "WEIGHT",
    label: "Weight",
    icon: <Scale size={20} />,
    color: "blue",
  },
  {
    value: "BLOOD_PRESSURE",
    label: "Blood Pressure",
    icon: <Activity size={20} />,
    color: "cyan",
  },
  {
    value: "HEART_RATE",
    label: "Heart Rate",
    icon: <HeartPulse size={20} />,
    color: "em",
  },
];

export default function LogPage() {
  const [type, setType] = useState<LogType>("WEIGHT");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bpm, setBpm] = useState("");
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setWeight("");
    setSystolic("");
    setDiastolic("");
    setBpm("");
    setNotes("");
    setTimestamp(new Date().toISOString().slice(0, 16));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const base: Record<string, unknown> = {
        timestamp: new Date(timestamp).toISOString(),
        notes,
      };

      if (type === "WEIGHT") {
        if (!weight) throw new Error("Please enter your weight.");
        await healthApi.addLog({
          ...base,
          type: "WEIGHT",
          weight: parseFloat(weight),
          unit,
        });
      } else if (type === "BLOOD_PRESSURE") {
        if (!systolic || !diastolic)
          throw new Error("Please enter both systolic and diastolic values.");
        await healthApi.addLog({
          ...base,
          type: "BLOOD_PRESSURE",
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
        });
      } else if (type === "HEART_RATE") {
        if (!bpm) throw new Error("Please enter your heart rate.");
        await healthApi.addLog({
          ...base,
          type: "HEART_RATE",
          bpm: parseInt(bpm),
        });
      }

      setSuccess(true);
      reset();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save log. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Log Health Data</h1>
        <p className="page-subtitle">Record a new health metric entry.</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Type selector */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            Metric Type
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`type-btn-${opt.value.toLowerCase()}`}
                type="button"
                onClick={() => {
                  setType(opt.value);
                  setError("");
                  setSuccess(false);
                }}
                className={`btn ${type === opt.value ? "btn-primary" : "btn-secondary"}`}
                style={{
                  flexDirection: "column",
                  gap: 8,
                  padding: "16px 8px",
                  background:
                    type === opt.value ? undefined : "var(--bg-surface)",
                }}>
                {opt.icon}
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 20 }}>
            <div>
              <div
                className="card-title"
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={`stat-icon ${selectedType.color}`}
                  style={{
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}>
                  {selectedType.icon}
                </span>
                {selectedType.label}
              </div>
              <div className="card-subtitle">
                Enter the measurement details below
              </div>
            </div>
          </div>

          {success && (
            <div className="alert alert-success fade-in">
              <CheckCircle size={16} /> Log saved successfully! ✓
            </div>
          )}
          {error && (
            <div className="alert alert-error fade-in">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Timestamp */}
            <div className="form-group">
              <label className="form-label" htmlFor="log-timestamp">
                Date & Time
              </label>
              <input
                id="log-timestamp"
                className="form-input"
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
              />
            </div>

            {/* Weight fields */}
            {type === "WEIGHT" && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="log-weight">
                    Weight
                  </label>
                  <input
                    id="log-weight"
                    className="form-input"
                    type="number"
                    placeholder="e.g. 70.5"
                    step="0.1"
                    min="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="log-unit">
                    Unit
                  </label>
                  <select
                    id="log-unit"
                    className="form-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as "kg" | "lbs")}>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Blood Pressure fields */}
            {type === "BLOOD_PRESSURE" && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="log-systolic">
                    Systolic (mmHg)
                  </label>
                  <input
                    id="log-systolic"
                    className="form-input"
                    type="number"
                    placeholder="e.g. 120"
                    min="50"
                    max="250"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="log-diastolic">
                    Diastolic (mmHg)
                  </label>
                  <input
                    id="log-diastolic"
                    className="form-input"
                    type="number"
                    placeholder="e.g. 80"
                    min="30"
                    max="150"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Heart Rate fields */}
            {type === "HEART_RATE" && (
              <div className="form-group">
                <label className="form-label" htmlFor="log-bpm">
                  Heart Rate (bpm)
                </label>
                <input
                  id="log-bpm"
                  className="form-input"
                  type="number"
                  placeholder="e.g. 72"
                  min="30"
                  max="250"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="log-notes">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StickyNote size={13} /> Notes (optional)
                </span>
              </label>
              <textarea
                id="log-notes"
                className="form-textarea"
                placeholder="e.g. After morning workout, felt slightly dehydrated…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* BP reference */}
            {type === "BLOOD_PRESSURE" && (
              <div className="alert alert-info" style={{ marginBottom: 18 }}>
                <Activity size={16} />
                <span>
                  Normal BP is approximately <strong>120/80 mmHg</strong>.
                  Always consult a healthcare professional.
                </span>
              </div>
            )}

            <button
              id="submit-log-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Saving…
                </>
              ) : (
                "Save Health Log"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
