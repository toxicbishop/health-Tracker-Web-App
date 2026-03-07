import { useState } from "react";
import { useHealthLogs, useAddHealthLog } from "../hooks/useHealthData";
import type { WeightLog, BPLog } from "../types/health";

export default function DashboardPage() {
  const { data: logs = [] } = useHealthLogs();
  const { mutateAsync: addLog } = useAddHealthLog();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [weightInput, setWeightInput] = useState("7");

  const weightLogs = logs.filter((l) => l.type === "WEIGHT") as WeightLog[];
  const bpLogs = logs.filter((l) => l.type === "BLOOD_PRESSURE") as BPLog[];

  const latestWeight = weightLogs.length
    ? weightLogs[weightLogs.length - 1].weight
    : 72.5;
  const latestSystolic = bpLogs.length
    ? bpLogs[bpLogs.length - 1].systolic
    : 120;
  const latestDiastolic = bpLogs.length
    ? bpLogs[bpLogs.length - 1].diastolic
    : 80;

  const handleAddBP = async () => {
    if (!systolic || !diastolic) return;
    await addLog({
      type: "BLOOD_PRESSURE",
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      timestamp: new Date().toISOString(),
      notes: "Quick Add via Dashboard",
    });
    setSystolic("");
    setDiastolic("");
  };

  const handleAddWeight = async () => {
    if (!weightInput) return;
    await addLog({
      type: "WEIGHT",
      weight: parseFloat(weightInput),
      unit: "kg",
      timestamp: new Date().toISOString(),
      notes: "Quick Add via Dashboard",
    });
    setWeightInput("");
  };

  return (
    <div className="dash-container">
      {/* Top Navbar with Logo */}
      <nav className="top-nav" style={{ borderBottom: "1px solid #e0dfd5" }}>
        <div className="wital-logo-container">
          <svg
            width="200"
            height="50"
            viewBox="0 0 240 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M40 10 L50 45 L60 25 L70 45 L80 10"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M40 10 L45 27" stroke="#000" strokeWidth="5" />
            <path
              d="M50 45 L60 25 L70 45 L80 10"
              stroke="#000"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M20 30 L45 30 L55 5 L65 55 L75 30 L100 30"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="95" y="10" width="5" height="35" fill="#000" />
            <path
              d="M125 10 L145 10 M135 10 L135 45"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M170 10 L155 45 M170 10 L185 45 M160 30 L180 30"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M205 10 L205 45 L225 45"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ padding: "1rem 0" }}>
        <h1 className="dash-header">Today's Vitals</h1>

        <div className="dash-grid">
          {/* Blood Pressure Card */}
          <div className="dash-card">
            <h2 className="dash-card-title">Blood Pressure</h2>
            <div className="dash-big-value">
              {latestSystolic}/{latestDiastolic}
            </div>
            <span className="dash-unit">mmHg</span>

            <div style={{ marginTop: "1rem" }}>
              <div className="dash-input-row">
                <label className="dash-input-label">Systolic</label>
                <input
                  type="number"
                  className="dash-input-box"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                />
              </div>
              <div className="dash-input-row" style={{ marginTop: "0.5rem" }}>
                <label className="dash-input-label">Diastolic</label>
                <input
                  type="number"
                  className="dash-input-box"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                />
              </div>
            </div>

            <button className="dash-add-btn" onClick={handleAddBP}>
              Add New
            </button>
          </div>

          {/* Weight Card */}
          <div className="dash-card">
            <h2 className="dash-card-title">Weight</h2>
            <div className="dash-big-value">{latestWeight}</div>
            <span className="dash-unit">kg</span>

            <div style={{ marginTop: "1rem" }}>
              {/* Invisible spacer spacing to align inputs height if needed, but actually the image just shows one input higher up */}
              <div className="dash-input-row" style={{ marginTop: "1rem" }}>
                {/* Image has the input alone */}
                <input
                  type="number"
                  className="dash-input-box"
                  style={{
                    width: "100%",
                    paddingLeft: "10px",
                    marginTop: "1.75rem",
                    marginBottom: "0.5rem",
                  }}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>

            <button
              className="dash-add-btn"
              onClick={handleAddWeight}
              style={{ marginTop: "1.3rem" }}>
              Add New
            </button>
          </div>
        </div>

        {/* Weekly Outlook */}
        <div className="weekly-outlook-card">
          <h2 className="weekly-title">Weekly Outlook</h2>
          <div className="weekly-chart">
            {/* Extremely simple mocked chart using raw SVG that matches exactly the image shape */}
            <svg
              viewBox="0 0 400 120"
              style={{ width: "100%", height: "100%" }}>
              {/* Horizontal Grid lines */}
              <line
                x1="0"
                y1="20"
                x2="400"
                y2="20"
                stroke="#d0cbc1"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="40"
                x2="400"
                y2="40"
                stroke="#d0cbc1"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="60"
                x2="400"
                y2="60"
                stroke="#d0cbc1"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="80"
                x2="400"
                y2="80"
                stroke="#d0cbc1"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="100"
                x2="400"
                y2="100"
                stroke="#d0cbc1"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="120"
                x2="400"
                y2="120"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Vertical axis line */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="120"
                stroke="#000"
                strokeWidth="2"
              />

              {/* Data path line */}
              <path
                d="M10 100 L60 85 L110 95 L160 65 L210 65 L260 45 L310 25 L360 20"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Points */}
              <circle cx="10" cy="100" r="4" fill="#000" />
              <circle cx="60" cy="85" r="4" fill="#000" />
              <circle cx="110" cy="95" r="4" fill="#000" />
              <circle cx="160" cy="65" r="4" fill="#000" />
              <circle cx="210" cy="65" r="4" fill="#000" />
              <circle cx="260" cy="45" r="4" fill="#000" />
              <circle cx="310" cy="25" r="4" fill="#000" />
              <circle cx="360" cy="20" r="4" fill="#000" />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
