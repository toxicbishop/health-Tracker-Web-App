import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAddHealthLog } from "../hooks/useHealthData";
import { Scale, Activity, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { HealthLog, WeightLog, BPLog, BothLog, ParameterType } from "../types/health";

type LogMode = "WEIGHT" | "BLOOD_PRESSURE" | "BOTH";

export default function LogPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addLog = useAddHealthLog();

  const mode = (searchParams.get("type") as LogMode) || "BOTH";

  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((mode === "WEIGHT" || mode === "BOTH") && (!weight || parseFloat(weight) <= 0)) {
      toast.error("Please enter a valid weight.");
      return;
    }
    if ((mode === "BLOOD_PRESSURE" || mode === "BOTH") && (!systolic || !diastolic)) {
      toast.error("Please enter both systolic and diastolic BP.");
      return;
    }

    // Construct the payload based on the mode
    const baseData = {
      type: mode as ParameterType,
      timestamp: new Date().toISOString(),
      notes: notes.trim(),
    };

    let finalPayload: Omit<HealthLog, "id" | "userId">;

    if (mode === "WEIGHT") {
      finalPayload = {
        ...baseData,
        type: "WEIGHT",
        weight: parseFloat(weight),
        unit: "kg",
      } as WeightLog;
    } else if (mode === "BLOOD_PRESSURE") {
      finalPayload = {
        ...baseData,
        type: "BLOOD_PRESSURE",
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
      } as BPLog;
    } else {
      finalPayload = {
        ...baseData,
        type: "BOTH",
        weight: parseFloat(weight),
        unit: "kg",
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
      } as BothLog;
    }

    try {
      await addLog.mutateAsync(finalPayload);
      setIsSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-card">
          <CheckCircle2 size={80} color="#27AE60" />
          <h2 className="success-title">Saved Successfully!</h2>
          <p className="success-subtitle">Redirecting home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="log-container">
      <nav className="top-nav">
        <button className="top-nav-back" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <span className="top-nav-title">
          {mode === "WEIGHT" ? "Log Weight" : mode === "BLOOD_PRESSURE" ? "Log BP" : "Log Both"}
        </span>
      </nav>

      <div className="page-wrap">
        <div className="log-form-card">
          <form onSubmit={handleSubmit}>
            {(mode === "WEIGHT" || mode === "BOTH") && (
              <div className="premium-field">
                <label className="premium-label">Weight (kg)</label>
                <div className="input-with-icon">
                  <Scale className="field-icon" size={24} />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    className="premium-input"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    autoFocus={mode === "WEIGHT" || mode === "BOTH"}
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}

            {(mode === "BLOOD_PRESSURE" || mode === "BOTH") && (
              <div className="bp-fields-group">
                <div className="premium-field">
                  <label className="premium-label">Systolic (Top)</label>
                  <div className="input-with-icon">
                    <Activity className="field-icon" size={24} />
                    <input
                      type="number"
                      placeholder="120"
                      className="premium-input"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="premium-field">
                  <label className="premium-label">Diastolic (Bottom)</label>
                  <div className="input-with-icon">
                    <Activity className="field-icon" size={24} style={{ opacity: 0.5 }} />
                    <input
                      type="number"
                      placeholder="80"
                      className="premium-input"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="premium-field" style={{ marginTop: "1rem" }}>
              <label className="premium-label">Notes (Optional)</label>
              <textarea
                placeholder="How are you feeling today?"
                className="premium-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="save-btn-premium" disabled={addLog.isPending}>
              {addLog.isPending ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
