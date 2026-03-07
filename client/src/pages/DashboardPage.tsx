import { useState, useMemo } from "react";
import { useHealthLogs, useAddHealthLog } from "../hooks/useHealthData";
import type { WeightLog, BPLog, HeartRateLog } from "../types/health";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { toast } from "sonner";

// ── VITAL Logo ──────────────────────────────────────────────────────────────
function VitalLogo() {
  return (
    <svg
      width="130"
      height="36"
      viewBox="0 0 280 78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 12 L28 66 L48 12"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M4 39 L20 39 L28 18 L36 60 L44 39 L54 39"
        stroke="#888"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="62"
        y1="12"
        x2="62"
        y2="66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="12"
        x2="105"
        y2="12"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <line
        x1="90"
        y1="12"
        x2="90"
        y2="66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M120 66 L140 12 L160 66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="127"
        y1="44"
        x2="153"
        y2="44"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M174 12 L174 66 L204 66"
        stroke="#111"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ── Weekly Sparkline chart ──────────────────────────────────────────────────
function WeeklyChart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="empty-state" style={{ padding: "1rem 0" }}>
        <p className="empty-desc">Not enough data for chart yet.</p>
      </div>
    );
  }
  const W = 320,
    H = 110,
    PAD = 8;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map(
    (_, i) => PAD + (i / (points.length - 1)) * (W - PAD * 2),
  );
  const ys = points.map((v) => H - PAD - ((v - min) / range) * (H - PAD * 2));
  const d = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(" ");
  return (
    <div className="weekly-chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((n) => (
          <line
            key={n}
            x1={PAD}
            y1={PAD + (n / 4) * (H - PAD * 2)}
            x2={W - PAD}
            y2={PAD + (n / 4) * (H - PAD * 2)}
            stroke="#cdc9b8"
            strokeWidth="0.8"
          />
        ))}
        {/* Axis */}
        <line
          x1={PAD}
          y1={PAD}
          x2={PAD}
          y2={H - PAD}
          stroke="#0d0c0a"
          strokeWidth="1.5"
        />
        <line
          x1={PAD}
          y1={H - PAD}
          x2={W - PAD}
          y2={H - PAD}
          stroke="#0d0c0a"
          strokeWidth="1.5"
        />
        {/* Line */}
        <path
          d={d}
          fill="none"
          stroke="#0d0c0a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="4" fill="#0d0c0a" />
        ))}
      </svg>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: logs = [], isLoading } = useHealthLogs();
  const { mutateAsync: addLog } = useAddHealthLog();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [bpLoading, setBpLoading] = useState(false);
  const [wtLoading, setWtLoading] = useState(false);

  const weightLogs = useMemo(
    () => logs.filter((l) => l.type === "WEIGHT") as WeightLog[],
    [logs],
  );
  const bpLogs = useMemo(
    () => logs.filter((l) => l.type === "BLOOD_PRESSURE") as BPLog[],
    [logs],
  );
  const hrLogs = useMemo(
    () => logs.filter((l) => l.type === "HEART_RATE") as HeartRateLog[],
    [logs],
  );

  const latestBP = bpLogs[bpLogs.length - 1];
  const latestWeight = weightLogs[weightLogs.length - 1];
  const latestHR = hrLogs[hrLogs.length - 1];

  // Weekly sparkline – prefer weight, fall back to BP systolic, then HR
  const weekAgo = subDays(new Date(), 7);
  const weeklyPoints = useMemo(() => {
    if (weightLogs.length >= 2) {
      return weightLogs
        .filter((l) => isAfter(parseISO(l.timestamp), weekAgo))
        .map((l) => l.weight);
    }
    if (bpLogs.length >= 2) {
      return bpLogs
        .filter((l) => isAfter(parseISO(l.timestamp), weekAgo))
        .map((l) => l.systolic);
    }
    return hrLogs
      .filter((l) => isAfter(parseISO(l.timestamp), weekAgo))
      .map((l) => l.bpm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  const handleAddBP = async () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!systolic || !diastolic || isNaN(sys) || isNaN(dia)) {
      toast.error("Enter both values.");
      return;
    }
    if (sys < 70 || sys > 250) {
      toast.error("Systolic must be 70–250.");
      return;
    }
    if (dia < 40 || dia > 150) {
      toast.error("Diastolic must be 40–150.");
      return;
    }
    setBpLoading(true);
    try {
      await addLog({
        type: "BLOOD_PRESSURE",
        systolic: sys,
        diastolic: dia,
        timestamp: new Date().toISOString(),
        notes: "",
      });
      setSystolic("");
      setDiastolic("");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setBpLoading(false);
    }
  };

  const handleAddWeight = async () => {
    const w = parseFloat(weightInput);
    if (!weightInput || isNaN(w) || w <= 0) {
      toast.error("Enter a valid weight.");
      return;
    }
    setWtLoading(true);
    try {
      await addLog({
        type: "WEIGHT",
        weight: w,
        unit: "kg",
        timestamp: new Date().toISOString(),
        notes: "",
      });
      setWeightInput("");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setWtLoading(false);
    }
  };

  const todayStr = format(new Date(), "EEEE, MMMM d");

  return (
    <div>
      {/* Nav */}
      <nav className="top-nav">
        <div className="vital-logo">
          <VitalLogo />
        </div>
      </nav>

      <div className="page-wrap">
        <h1 className="page-title">Today's Vitals</h1>
        <p
          className="page-subtitle"
          style={{ textAlign: "center", marginTop: "-0.5rem" }}>
          {todayStr}
        </p>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}>
            <div className="card-grid-2">
              <div className="card skeleton" style={{ height: 200 }} />
              <div className="card skeleton" style={{ height: 200 }} />
            </div>
            <div className="card skeleton" style={{ height: 180 }} />
          </div>
        ) : (
          <>
            {/* Stat row */}
            {latestHR && (
              <div
                className="card"
                style={{
                  marginBottom: "0.85rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1.5rem",
                  padding: "0.75rem 1rem",
                }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-dim)",
                      marginBottom: 2,
                    }}>
                    Heart Rate
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.3rem",
                    }}>
                    {latestHR.bpm}{" "}
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}>
                      bpm
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main 2-col cards */}
            <div className="card-grid-2">
              {/* Blood Pressure */}
              <div className="card">
                <div className="card-title-sm">Blood Pressure</div>
                <div className="card-big-value">
                  {latestBP
                    ? `${latestBP.systolic}/${latestBP.diastolic}`
                    : "—"}
                </div>
                <span className="card-unit">mmHg</span>

                <div className="input-row">
                  <span className="input-row-label">Systolic</span>
                  <input
                    className="inline-input"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBP()}
                  />
                </div>
                <div className="input-row" style={{ marginTop: "0.4rem" }}>
                  <span className="input-row-label">Diastolic</span>
                  <input
                    className="inline-input"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBP()}
                  />
                </div>
                <button
                  className="btn-tan"
                  onClick={handleAddBP}
                  disabled={bpLoading}>
                  {bpLoading ? "Saving…" : "Add New"}
                </button>
              </div>

              {/* Weight */}
              <div className="card">
                <div className="card-title-sm">Weight</div>
                <div className="card-big-value">
                  {latestWeight ? latestWeight.weight : "—"}
                </div>
                <span className="card-unit">kg</span>

                <div style={{ marginTop: "1.75rem" }}>
                  <input
                    className="inline-input"
                    type="number"
                    placeholder="72.5"
                    step="0.1"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddWeight()}
                    style={{ width: "100%", textAlign: "left" }}
                  />
                </div>
                <button
                  className="btn-tan"
                  onClick={handleAddWeight}
                  disabled={wtLoading}
                  style={{ marginTop: "0.6rem" }}>
                  {wtLoading ? "Saving…" : "Add New"}
                </button>
              </div>
            </div>

            {/* Weekly Outlook */}
            <div className="card" style={{ marginTop: "0.85rem" }}>
              <div className="card-section-title">Weekly Outlook</div>
              <WeeklyChart points={weeklyPoints} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
