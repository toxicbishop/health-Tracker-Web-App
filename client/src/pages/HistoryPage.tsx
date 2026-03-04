import { useEffect, useState } from "react";
import { healthApi } from "../api/health";
import type {
  HealthLog,
  WeightLog,
  BPLog,
  HeartRateLog,
} from "../types/health";
import {
  Scale,
  Activity,
  HeartPulse,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

type FilterType = "ALL" | "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLogDisplayValue(log: HealthLog): { primary: string; unit: string } {
  if (log.type === "WEIGHT") {
    const l = log as WeightLog;
    return { primary: `${l.weight}`, unit: l.unit };
  }
  if (log.type === "BLOOD_PRESSURE") {
    const l = log as BPLog;
    return { primary: `${l.systolic}/${l.diastolic}`, unit: "mmHg" };
  }
  if (log.type === "HEART_RATE") {
    return { primary: `${(log as HeartRateLog).bpm}`, unit: "bpm" };
  }
  return { primary: "—", unit: "" };
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

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WEIGHT", label: "Weight" },
  { value: "BLOOD_PRESSURE", label: "Blood Pressure" },
  { value: "HEART_RATE", label: "Heart Rate" },
];

export default function HistoryPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = async (type?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await healthApi.getLogs(type === "ALL" ? undefined : type);
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setLogs(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filter === "ALL" ? undefined : filter);
  }, [filter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const value = getLogDisplayValue(log).primary;
    return (
      log.type.toLowerCase().includes(search.toLowerCase()) ||
      value.includes(search) ||
      (log.notes ?? "").toLowerCase().includes(search.toLowerCase()) ||
      formatDateTime(log.timestamp).toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}>
        <div>
          <h1 className="page-title">Health History</h1>
          <p className="page-subtitle">
            All your logged health metrics in one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            id="history-refresh-btn"
            onClick={() => fetchLogs(filter === "ALL" ? undefined : filter)}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link
            to="/log"
            className="btn btn-primary btn-sm"
            id="history-add-btn">
            + Log New
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filter & Search bar */}
      <div
        style={{
          display: "flex",
          gap: 14,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
        <div className="tabs" id="filter-tabs">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`filter-${opt.value.toLowerCase()}`}
              className={`tab-btn ${filter === opt.value ? "active" : ""}`}
              onClick={() => setFilter(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>

        <div
          className="form-input-with-icon"
          style={{ flex: 1, minWidth: 200 }}>
          <span className="form-input-icon">
            <Search size={15} />
          </span>
          <input
            id="history-search"
            className="form-input"
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div
          className="glass-pill"
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={12} />
          {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "60px 0",
            color: "var(--text-secondary)",
            gap: 12,
            alignItems: "center",
          }}>
          <div
            className="spinner"
            style={{
              borderTopColor: "var(--accent-blue)",
              borderColor: "rgba(59,130,246,0.2)",
            }}
          />
          Loading logs…
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <div className="empty-title">
              {search ? "No matching logs found" : "No logs yet"}
            </div>
            <p className="empty-desc">
              {search
                ? `No logs match "${search}". Try a different search term.`
                : "Start logging your health metrics to see them here."}
            </p>
            {!search && (
              <Link
                to="/log"
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}>
                + Add First Log
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="log-list">
          {filteredLogs.map((log) => {
            const typeStyle = getTypeStyle(log.type);
            const { primary, unit } = getLogDisplayValue(log);
            return (
              <div key={log.id} className="log-item fade-in">
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
                  <div className="log-item-number">{primary}</div>
                  <div className="log-item-unit">{unit}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
