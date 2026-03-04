import { useEffect, useState } from "react";
import { healthApi } from "../api/health";
import type {
  HealthLog,
  WeightLog,
  BPLog,
  HeartRateLog,
} from "../types/health";
import { useAuth } from "../context/AuthContext";
import {
  Scale,
  HeartPulse,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Link } from "react-router-dom";

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLogDisplayValue(log: HealthLog): string {
  if (log.type === "WEIGHT")
    return `${(log as WeightLog).weight} ${(log as WeightLog).unit}`;
  if (log.type === "BLOOD_PRESSURE")
    return `${(log as BPLog).systolic}/${(log as BPLog).diastolic} mmHg`;
  if (log.type === "HEART_RATE") return `${(log as HeartRateLog).bpm} bpm`;
  return "—";
}

interface TypeStyle {
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
  label: string;
}

function getTypeStyle(type: string): TypeStyle {
  switch (type) {
    case "WEIGHT":
      return {
        icon: <Scale size={18} />,
        colorClass: "blue",
        badgeClass: "badge-blue",
        label: "Weight",
      };
    case "BLOOD_PRESSURE":
      return {
        icon: <Activity size={18} />,
        colorClass: "cyan",
        badgeClass: "badge-cyan",
        label: "Blood Pressure",
      };
    case "HEART_RATE":
      return {
        icon: <HeartPulse size={18} />,
        colorClass: "em",
        badgeClass: "badge-em",
        label: "Heart Rate",
      };
    default:
      return {
        icon: <Activity size={18} />,
        colorClass: "violet",
        badgeClass: "badge-violet",
        label: type,
      };
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
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-bright)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
      }}>
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await healthApi.getLogs();
      setLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const weightLogs = logs.filter((l) => l.type === "WEIGHT") as WeightLog[];
  const bpLogs = logs.filter((l) => l.type === "BLOOD_PRESSURE") as BPLog[];
  const hrLogs = logs.filter((l) => l.type === "HEART_RATE") as HeartRateLog[];

  const latestWeight = weightLogs[weightLogs.length - 1];
  const latestBP = bpLogs[bpLogs.length - 1];
  const latestHR = hrLogs[hrLogs.length - 1];

  const weightChartData = weightLogs.slice(-12).map((l) => ({
    date: formatDate(l.timestamp),
    value: l.weight,
  }));

  const hrChartData = hrLogs.slice(-12).map((l) => ({
    date: formatDate(l.timestamp),
    value: l.bpm,
  }));

  const bpChartData = bpLogs.slice(-10).map((l) => ({
    date: formatDate(l.timestamp),
    systolic: l.systolic,
    diastolic: l.diastolic,
  }));

  const recentLogs = [...logs]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 6);

  const getTrend = (arr: number[]) => {
    if (arr.length < 2) return "neu";
    return arr[arr.length - 1] > arr[arr.length - 2] ? "up" : "down";
  };

  const weightTrend = getTrend(weightLogs.map((l) => l.weight));
  const hrTrend = getTrend(hrLogs.map((l) => l.bpm));

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading your health data…</span>
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="fade-in-up">
      {/* Page header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.username ?? "there"} 👋
          </h1>
          <p className="page-subtitle">
            Here's an overview of your health metrics.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn-secondary btn-sm"
            id="refresh-btn"
            onClick={fetchLogs}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/log" className="btn btn-primary btn-sm" id="quick-log-btn">
            + Log Health
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error fade-in" style={{ marginBottom: 24 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">
            <Scale size={20} />
          </div>
          <div className="stat-value">
            {latestWeight ? latestWeight.weight : "—"}
          </div>
          <div className="stat-label">
            Latest Weight ({latestWeight?.unit ?? "kg"})
          </div>
          {weightLogs.length >= 2 && (
            <span className={`stat-change ${weightTrend}`}>
              {weightTrend === "up" ? (
                <TrendingUp size={11} />
              ) : weightTrend === "down" ? (
                <TrendingDown size={11} />
              ) : (
                <Minus size={11} />
              )}
              {Math.abs(
                weightLogs[weightLogs.length - 1].weight -
                  weightLogs[weightLogs.length - 2].weight,
              ).toFixed(1)}{" "}
              kg since last
            </span>
          )}
        </div>

        <div className="stat-card cyan">
          <div className="stat-icon cyan">
            <Activity size={20} />
          </div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "—"}
          </div>
          <div className="stat-label">Blood Pressure (mmHg)</div>
          {latestBP && (
            <span
              className={`stat-change ${latestBP.systolic > 130 ? "up" : "neu"}`}>
              {latestBP.systolic > 130
                ? "Elevated"
                : latestBP.systolic < 90
                  ? "Low"
                  : "Normal range"}
            </span>
          )}
        </div>

        <div className="stat-card em">
          <div className="stat-icon em">
            <HeartPulse size={20} />
          </div>
          <div className="stat-value">{latestHR ? latestHR.bpm : "—"}</div>
          <div className="stat-label">Heart Rate (bpm)</div>
          {hrLogs.length >= 2 && (
            <span className={`stat-change ${hrTrend}`}>
              {hrTrend === "up" ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              {Math.abs(
                hrLogs[hrLogs.length - 1].bpm - hrLogs[hrLogs.length - 2].bpm,
              )}{" "}
              bpm since last
            </span>
          )}
        </div>

        <div className="stat-card violet">
          <div className="stat-icon violet">
            <TrendingUp size={20} />
          </div>
          <div className="stat-value">{logs.length}</div>
          <div className="stat-label">Total Entries Logged</div>
          <span className="stat-change neu">
            {weightLogs.length}W · {bpLogs.length}BP · {hrLogs.length}HR
          </span>
        </div>
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 24,
        }}>
        {/* Weight chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weight Trend</div>
              <div className="card-subtitle">
                {weightLogs.length} entries tracked
              </div>
            </div>
            <span className="badge badge-blue">
              <Scale size={11} /> Weight
            </span>
          </div>
          {weightChartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weightChartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#weightGrad)"
                    dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <span className="empty-icon">⚖️</span>
              <p className="empty-desc">No weight logs yet.</p>
            </div>
          )}
        </div>

        {/* Heart Rate chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Heart Rate Trend</div>
              <div className="card-subtitle">
                {hrLogs.length} entries tracked
              </div>
            </div>
            <span className="badge badge-em">
              <HeartPulse size={11} /> HR
            </span>
          </div>
          {hrChartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hrChartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#hrGrad)"
                    dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <span className="empty-icon">💓</span>
              <p className="empty-desc">No heart rate logs yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* BP chart */}
      {bpChartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Blood Pressure Trend</div>
              <div className="card-subtitle">
                Systolic & Diastolic over time
              </div>
            </div>
            <span className="badge badge-cyan">
              <Activity size={11} /> Blood Pressure
            </span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bpChartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: "#06b6d4", r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }}
                />
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
            <div className="card-subtitle">
              Your last {recentLogs.length} health logs
            </div>
          </div>
          <Link
            to="/history"
            className="btn btn-secondary btn-sm"
            id="view-all-btn">
            View all
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <div className="empty-title">No logs yet</div>
            <p className="empty-desc">
              Start logging your health metrics to see them here.
            </p>
            <Link
              to="/log"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8 }}>
              + Add First Log
            </Link>
          </div>
        ) : (
          <div className="log-list">
            {recentLogs.map((log) => {
              const typeStyle = getTypeStyle(log.type);
              return (
                <div key={log.id} className="log-item">
                  <div
                    className={`log-item-icon stat-icon ${typeStyle.colorClass}`}>
                    {typeStyle.icon}
                  </div>
                  <div className="log-item-body">
                    <div className="log-item-type">
                      <span className={`badge ${typeStyle.badgeClass}`}>
                        {typeStyle.label}
                      </span>
                    </div>
                    <div className="log-item-meta">
                      {formatDateTime(log.timestamp)}
                    </div>
                    {log.notes && (
                      <div
                        className="log-item-meta"
                        style={{
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                          marginTop: 2,
                        }}>
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                  <div className="log-item-value">
                    <div className="log-item-number">
                      {getLogDisplayValue(log)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
