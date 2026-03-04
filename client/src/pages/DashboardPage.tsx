import { useState, useMemo } from "react";
import { useHealthLogs } from "../hooks/useHealthData";
import type { HealthLog, WeightLog, BPLog, HeartRateLog } from "../types/health";
import { useAuth } from "../context/AuthContext";
import {
  Scale, HeartPulse, Activity, TrendingUp, TrendingDown,
  Minus, AlertCircle, RefreshCw, Download, Printer,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { Link } from "react-router-dom";
import { subDays, subMonths, startOfYear, isAfter, parseISO, format } from "date-fns";
import { motion } from "framer-motion";

// ─────────────────────────── helpers ────────────────────────────────────────
function formatDate(ts: string) {
  return format(parseISO(ts), "MMM d");
}

function formatDateTime(ts: string) {
  return format(parseISO(ts), "MMM d, h:mm a");
}

function getLogDisplayValue(log: HealthLog): string {
  if (log.type === "WEIGHT") return `${(log as WeightLog).weight} ${(log as WeightLog).unit}`;
  if (log.type === "BLOOD_PRESSURE") return `${(log as BPLog).systolic}/${(log as BPLog).diastolic} mmHg`;
  if (log.type === "HEART_RATE") return `${(log as HeartRateLog).bpm} bpm`;
  return "—";
}

function avg(arr: number[]) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getTypeStyle(type: string) {
  switch (type) {
    case "WEIGHT": return { icon: <Scale size={18} />, colorClass: "blue", badgeClass: "badge-blue", label: "Weight" };
    case "BLOOD_PRESSURE": return { icon: <Activity size={18} />, colorClass: "cyan", badgeClass: "badge-cyan", label: "Blood Pressure" };
    case "HEART_RATE": return { icon: <HeartPulse size={18} />, colorClass: "em", badgeClass: "badge-em", label: "Heart Rate" };
    default: return { icon: <Activity size={18} />, colorClass: "violet", badgeClass: "badge-violet", label: type };
  }
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>
          {p.name === "systolic"
            ? `${p.value} / ${payload.find((x) => x.name === "diastolic")?.value} mmHg`
            : `${p.value}`}
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────── Date Range ─────────────────────────────────────
type RangePreset = "7d" | "30d" | "90d" | "ytd" | "all" | "custom";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

function getRangeStart(preset: RangePreset, customFrom: string): Date | null {
  const now = new Date();
  switch (preset) {
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "90d": return subDays(now, 90);
    case "ytd": return startOfYear(now);
    case "all": return null;
    case "custom": return customFrom ? new Date(customFrom) : null;
  }
}

// ─────────────────────────── CSV Export ─────────────────────────────────────
function exportCSV(logs: HealthLog[], filename = "health-logs.csv") {
  const rows = [["Date", "Type", "Value", "Unit", "Notes"]];
  logs.forEach((log) => {
    let value = "";
    let unit = "";
    if (log.type === "WEIGHT") { value = String((log as WeightLog).weight); unit = (log as WeightLog).unit; }
    else if (log.type === "BLOOD_PRESSURE") { value = `${(log as BPLog).systolic}/${(log as BPLog).diastolic}`; unit = "mmHg"; }
    else if (log.type === "HEART_RATE") { value = String((log as HeartRateLog).bpm); unit = "bpm"; }
    rows.push([format(parseISO(log.timestamp), "yyyy-MM-dd HH:mm"), log.type, value, unit, log.notes ?? ""]);
  });
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { data: logs = [], isLoading, isError, error, refetch } = useHealthLogs();

  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // ─── Date filtering ──────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const rangeStart = getRangeStart(rangePreset, customFrom);
    const rangeEnd = rangePreset === "custom" && customTo ? new Date(customTo) : null;
    return logs.filter((log) => {
      const d = parseISO(log.timestamp);
      if (rangeStart && !isAfter(d, rangeStart)) return false;
      if (rangeEnd && isAfter(d, rangeEnd)) return false;
      return true;
    });
  }, [logs, rangePreset, customFrom, customTo]);

  const weightLogs = filteredLogs.filter((l) => l.type === "WEIGHT") as WeightLog[];
  const bpLogs = filteredLogs.filter((l) => l.type === "BLOOD_PRESSURE") as BPLog[];
  const hrLogs = filteredLogs.filter((l) => l.type === "HEART_RATE") as HeartRateLog[];

  // For "previous period" comparison, use equal prior window
  const prevLogs = useMemo(() => {
    const rangeStart = getRangeStart(rangePreset, customFrom);
    if (!rangeStart || rangePreset === "all") return [];
    const periodMs = new Date().getTime() - rangeStart.getTime();
    const prevStart = new Date(rangeStart.getTime() - periodMs);
    return logs.filter((log) => {
      const d = parseISO(log.timestamp);
      return isAfter(d, prevStart) && !isAfter(d, rangeStart);
    });
  }, [logs, rangePreset, customFrom]);

  const prevWeight = prevLogs.filter((l) => l.type === "WEIGHT") as WeightLog[];
  const prevHR = prevLogs.filter((l) => l.type === "HEART_RATE") as HeartRateLog[];

  const latestWeight = weightLogs[weightLogs.length - 1];
  const latestBP = bpLogs[bpLogs.length - 1];
  const latestHR = hrLogs[hrLogs.length - 1];

  const avgWeight = avg(weightLogs.map((l) => l.weight));
  const prevAvgWeight = avg(prevWeight.map((l) => l.weight));
  const avgHR = avg(hrLogs.map((l) => l.bpm));
  const prevAvgHR = avg(prevHR.map((l) => l.bpm));
  const minWeight = weightLogs.length ? Math.min(...weightLogs.map((l) => l.weight)) : null;
  const maxWeight = weightLogs.length ? Math.max(...weightLogs.map((l) => l.weight)) : null;
  const minHR = hrLogs.length ? Math.min(...hrLogs.map((l) => l.bpm)) : null;
  const maxHR = hrLogs.length ? Math.max(...hrLogs.map((l) => l.bpm)) : null;

  const weightChartData = weightLogs.slice(-20).map((l) => ({ date: formatDate(l.timestamp), value: l.weight }));
  const hrChartData = hrLogs.slice(-20).map((l) => ({ date: formatDate(l.timestamp), value: l.bpm }));
  const bpChartData = bpLogs.slice(-14).map((l) => ({ date: formatDate(l.timestamp), systolic: l.systolic, diastolic: l.diastolic }));

  const recentLogs = [...filteredLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const getTrend = (arr: number[]) => {
    if (arr.length < 2) return "neu";
    return arr[arr.length - 1] > arr[arr.length - 2] ? "up" : "down";
  };
  const weightTrend = getTrend(weightLogs.map((l) => l.weight));
  const hrTrend = getTrend(hrLogs.map((l) => l.bpm));

  const pctChange = (curr: number | null, prev: number | null) => {
    if (!curr || !prev) return null;
    return ((curr - prev) / prev) * 100;
  };
  const weightPct = pctChange(avgWeight, prevAvgWeight);
  const hrPct = pctChange(avgHR, prevAvgHR);

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-heading" style={{ width: 280, marginBottom: 10 }} />
          <div className="skeleton skeleton-text" style={{ width: 200 }} />
        </div>
        <div className="skeleton-stat-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-stat-card">
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: "var(--radius-md)" }} />
              <div className="skeleton skeleton-heading" style={{ width: "55%" }} />
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="skeleton skeleton-chart" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">{greeting()}, {user?.username ?? "there"}</h1>
          <p className="page-subtitle">Here's an overview of your health metrics.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="export-bar">
            <button
              className="btn btn-secondary btn-sm"
              id="export-csv-btn"
              onClick={() => exportCSV(filteredLogs)}
              title="Export as CSV">
              <Download size={13} /> CSV
            </button>
            <button
              className="btn btn-secondary btn-sm"
              id="export-pdf-btn"
              onClick={() => window.print()}
              title="Print / Save as PDF">
              <Printer size={13} /> PDF
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" id="refresh-btn" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/log" className="btn btn-primary btn-sm" id="quick-log-btn">
            + Log Health
          </Link>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="alert alert-error fade-in" style={{ marginBottom: 24 }}>
          <AlertCircle size={16} /> {error instanceof Error ? error.message : "Failed to load logs"}
        </div>
      )}

      {/* Date Range Filter */}
      <div className="date-range-bar">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            className={`date-range-btn${rangePreset === p.value ? " active" : ""}`}
            onClick={() => setRangePreset(p.value)}>
            {p.label}
          </button>
        ))}
        {rangePreset === "custom" && (
          <div className="date-range-custom">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} max={customTo || undefined} />
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} min={customFrom || undefined} />
          </div>
        )}
        <span className="glass-pill">{filteredLogs.length} entries</span>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <motion.div className="stat-card blue" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="stat-icon blue"><Scale size={20} /></div>
          <div className="stat-value">{latestWeight ? latestWeight.weight : "—"}</div>
          <div className="stat-label">Latest Weight ({latestWeight?.unit ?? "kg"})</div>
          {weightLogs.length >= 2 && (
            <span className={`stat-change ${weightTrend}`}>
              {weightTrend === "up" ? <TrendingUp size={11} /> : weightTrend === "down" ? <TrendingDown size={11} /> : <Minus size={11} />}
              {Math.abs(weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight).toFixed(1)} kg since last
            </span>
          )}
        </motion.div>

        <motion.div className="stat-card cyan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="stat-icon cyan"><Activity size={20} /></div>
          <div className="stat-value" style={{ fontSize: 22 }}>{latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "—"}</div>
          <div className="stat-label">Blood Pressure (mmHg)</div>
          {latestBP && (
            <span className={`stat-change ${latestBP.systolic > 130 ? "up" : "neu"}`}>
              {latestBP.systolic > 130 ? "Elevated" : latestBP.systolic < 90 ? "Low" : "Normal range"}
            </span>
          )}
        </motion.div>

        <motion.div className="stat-card em" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="stat-icon em"><HeartPulse size={20} /></div>
          <div className="stat-value">{latestHR ? latestHR.bpm : "—"}</div>
          <div className="stat-label">Heart Rate (bpm)</div>
          {hrLogs.length >= 2 && (
            <span className={`stat-change ${hrTrend}`}>
              {hrTrend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(hrLogs[hrLogs.length - 1].bpm - hrLogs[hrLogs.length - 2].bpm)} bpm since last
            </span>
          )}
        </motion.div>

        <motion.div className="stat-card violet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="stat-icon violet"><TrendingUp size={20} /></div>
          <div className="stat-value">{filteredLogs.length}</div>
          <div className="stat-label">Entries in Period</div>
          <span className="stat-change neu">{weightLogs.length}W · {bpLogs.length}BP · {hrLogs.length}HR</span>
        </motion.div>
      </div>

      {/* Analytics Cards */}
      {(avgWeight || avgHR) && (
        <div className="analytics-grid" style={{ marginBottom: 24 }}>
          {avgWeight && (
            <>
              <div className="analytics-card">
                <div className="analytics-card-label">Avg Weight</div>
                <div className="analytics-card-value" style={{ color: "var(--accent-blue)" }}>{avgWeight.toFixed(1)}</div>
                <div className="analytics-card-sub">
                  {weightPct !== null ? (
                    <span style={{ color: weightPct < 0 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {weightPct > 0 ? "+" : ""}{weightPct.toFixed(1)}% vs prev period
                    </span>
                  ) : "No prior period data"}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-label">Weight Range</div>
                <div className="analytics-card-value" style={{ color: "var(--accent-cyan)", fontSize: 16 }}>
                  {minWeight?.toFixed(1)} – {maxWeight?.toFixed(1)}
                </div>
                <div className="analytics-card-sub">Min – Max in period</div>
              </div>
            </>
          )}
          {avgHR && (
            <>
              <div className="analytics-card">
                <div className="analytics-card-label">Avg Heart Rate</div>
                <div className="analytics-card-value" style={{ color: "var(--accent-emerald)" }}>{Math.round(avgHR)}</div>
                <div className="analytics-card-sub">
                  {hrPct !== null ? (
                    <span style={{ color: hrPct > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
                      {hrPct > 0 ? "+" : ""}{hrPct.toFixed(1)}% vs prev period
                    </span>
                  ) : "No prior period data"}
                </div>
              </div>
              <div className="analytics-card">
                <div className="analytics-card-label">HR Range</div>
                <div className="analytics-card-value" style={{ color: "var(--accent-violet)", fontSize: 16 }}>
                  {minHR} – {maxHR}
                </div>
                <div className="analytics-card-sub">Min – Max bpm</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weight Trend</div>
              <div className="card-subtitle">{weightLogs.length} entries</div>
            </div>
            <span className="badge badge-blue"><Scale size={11} /> Weight</span>
          </div>
          {weightChartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#weightGrad)" dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <span className="empty-icon">⚖️</span>
              <p className="empty-desc">No weight logs in this period.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Heart Rate Trend</div>
              <div className="card-subtitle">{hrLogs.length} entries</div>
            </div>
            <span className="badge badge-em"><HeartPulse size={11} /> HR</span>
          </div>
          {hrChartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hrChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#hrGrad)" dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <span className="empty-icon">💓</span>
              <p className="empty-desc">No heart rate logs in this period.</p>
            </div>
          )}
        </div>
      </div>

      {bpChartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Blood Pressure Trend</div>
              <div className="card-subtitle">Systolic & Diastolic over time</div>
            </div>
            <span className="badge badge-cyan"><Activity size={11} /> Blood Pressure</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="systolic" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 4, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Entries</div>
            <div className="card-subtitle">Your last {recentLogs.length} health logs</div>
          </div>
          <Link to="/history" className="btn btn-secondary btn-sm" id="view-all-btn">View all</Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <div className="empty-title">No logs in this period</div>
            <p className="empty-desc">Try selecting a wider date range or log new health data.</p>
            <Link to="/log" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>+ Add First Log</Link>
          </div>
        ) : (
          <div className="log-list">
            {recentLogs.map((log, i) => {
              const typeStyle = getTypeStyle(log.type);
              return (
                <motion.div
                  key={log.id}
                  className="log-item"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className={`log-item-icon stat-icon ${typeStyle.colorClass}`}>{typeStyle.icon}</div>
                  <div className="log-item-body">
                    <div className="log-item-type">
                      <span className={`badge ${typeStyle.badgeClass}`}>{typeStyle.label}</span>
                    </div>
                    <div className="log-item-meta">{formatDateTime(log.timestamp)}</div>
                    {log.notes && (
                      <div className="log-item-meta" style={{ color: "var(--text-muted)", fontStyle: "italic", marginTop: 2 }}>
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                  <div className="log-item-value">
                    <div className="log-item-number">{getLogDisplayValue(log)}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
