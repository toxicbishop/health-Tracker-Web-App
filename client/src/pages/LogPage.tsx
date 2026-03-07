import { useState } from "react";
import { useAddHealthLog } from "../hooks/useHealthData";
import { Scale, Activity, HeartPulse, StickyNote } from "lucide-react";
import { toast } from "sonner";

type LogType = "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

const TYPE_OPTIONS = [
  { value: "WEIGHT" as LogType, label: "Weight", icon: <Scale size={20} /> },
  {
    value: "BLOOD_PRESSURE" as LogType,
    label: "Blood Pressure",
    icon: <Activity size={20} />,
  },
  {
    value: "HEART_RATE" as LogType,
    label: "Heart Rate",
    icon: <HeartPulse size={20} />,
  },
];

export default function LogPage() {
  const addLog = useAddHealthLog();

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

  const reset = () => {
    setWeight("");
    setSystolic("");
    setDiastolic("");
    setBpm("");
    setNotes("");
    setTimestamp(new Date().toISOString().slice(0, 16));
  };

  const validate = (): string | null => {
    if (type === "WEIGHT") {
      if (!weight) return "Please enter your weight.";
      const w = parseFloat(weight);
      if (isNaN(w) || w <= 0) return "Weight must be a positive number.";
      if (w > 1000) return "Weight value is unrealistically high.";
    } else if (type === "BLOOD_PRESSURE") {
      if (!systolic || !diastolic) return "Enter both systolic and diastolic.";
      const sys = parseInt(systolic),
        dia = parseInt(diastolic);
      if (sys < 70 || sys > 300) return "Systolic must be 70–300 mmHg.";
      if (dia < 40 || dia > 150) return "Diastolic must be 40–150 mmHg.";
      if (sys <= dia) return "Systolic must be greater than diastolic.";
    } else {
      if (!bpm) return "Please enter your heart rate.";
      const b = parseInt(bpm);
      if (isNaN(b) || b <= 0 || b > 300) return "Heart rate must be 1–300 bpm.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const base = {
      timestamp: new Date(timestamp).toISOString(),
      notes: notes.trim(),
    };
    let payload: Record<string, unknown>;
    if (type === "WEIGHT")
      payload = { ...base, type, weight: parseFloat(weight), unit };
    else if (type === "BLOOD_PRESSURE")
      payload = {
        ...base,
        type,
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
      };
    else payload = { ...base, type, bpm: parseInt(bpm) };

    try {
      await addLog.mutateAsync(payload);
      reset();
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type)!;

  return (
    <div>
      <nav className="top-nav">
        <span className="top-nav-title">Log Health Data</span>
      </nav>

      <div className="page-wrap">
        <h1 className="page-title-left" style={{ marginBottom: "1rem" }}>
          New Entry
        </h1>

        {/* Type picker */}
        <div className="type-picker">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`type-btn-${opt.value.toLowerCase()}`}
              type="button"
              className={`type-btn${type === opt.value ? " active" : ""}`}
              onClick={() => setType(opt.value)}>
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "1.25rem",
            }}>
            <span style={{ opacity: 0.5 }}>{selectedType.icon}</span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.15rem",
                }}>
                {selectedType.label}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                Enter measurement details below
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} data-testid="log-form">
            {/* Timestamp */}
            <div className="form-group">
              <label className="form-label" htmlFor="log-timestamp">
                Date &amp; Time
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

            {/* Weight */}
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
                    data-testid="weight-input"
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

            {/* Blood Pressure */}
            {type === "BLOOD_PRESSURE" && (
              <>
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
                      data-testid="systolic-input"
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
                      data-testid="diastolic-input"
                    />
                  </div>
                </div>
                <div className="alert alert-info">
                  <Activity size={14} />
                  <span>
                    Normal BP ≈ <strong>120/80 mmHg</strong>. Consult a
                    professional for guidance.
                  </span>
                </div>
              </>
            )}

            {/* Heart Rate */}
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
                  data-testid="bpm-input"
                />
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="log-notes">
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <StickyNote size={12} /> Notes (optional)
                </span>
              </label>
              <textarea
                id="log-notes"
                className="form-textarea"
                placeholder="e.g. After morning workout…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="notes-input"
              />
            </div>

            <button
              id="submit-log-btn"
              type="submit"
              className="btn-primary"
              disabled={addLog.isPending}
              data-testid="submit-log-btn">
              {addLog.isPending ? "Saving…" : "Save Health Log"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
