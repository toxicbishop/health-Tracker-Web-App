import { useState, useMemo } from "react";
import { useHealthLogs } from "../hooks/useHealthData";
import type { HealthLog, WeightLog, BPLog, HeartRateLog } from "../types/health";
import { Scale, Activity, HeartPulse, Search, Filter, AlertCircle, RefreshCw, Download, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

type FilterType = "ALL" | "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

function formatDateTime(ts: string) {
  return format(parseISO(ts), "MMM d, yyyy, h:mm a");
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

function getTypeStyle(type: string) {
  switch (type) {
    case "WEIGHT": return { icon: <Scale size={18} />, colorClass: "blue", badgeClass: "badge-blue", label: "Weight" };
    case "BLOOD_PRESSURE": return { icon: <Activity size={18} />, colorClass: "cyan", badgeClass: "badge-cyan", label: "Blood Pressure" };
    case "HEART_RATE": return { icon: <HeartPulse size={18} />, colorClass: "em", badgeClass: "badge-em", label: "Heart Rate" };
    default: return { icon: <Activity size={18} />, colorClass: "violet", badgeClass: "badge-violet", label: type };
  }
}

function exportCSV(logs: HealthLog[]) {
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
  a.download = "health-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WEIGHT", label: "Weight" },
  { value: "BLOOD_PRESSURE", label: "Blood Pressure" },
  { value: "HEART_RATE", label: "Heart Rate" },
];

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { data: logs = [], isLoading, isError, error, refetch } = useHealthLogs();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sortedLogs = useMemo(() =>
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return sortedLogs.filter((log) => {
      if (filter !== "ALL" && log.type !== filter) return false;
      if (!search) return true;
      const { primary } = getLogDisplayValue(log);
      return (
        log.type.toLowerCase().includes(search.toLowerCase()) ||
        primary.includes(search) ||
        (log.notes ?? "").toLowerCase().includes(search.toLowerCase()) ||
        formatDateTime(log.timestamp).toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [sortedLogs, filter, search]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter/search changes
  const handleFilter = (f: FilterType) => { setFilter(f); setPage(1); };
  const handleSearch = (s: string) => { setSearch(s); setPage(1); };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Health History</h1>
          <p className="page-subtitle">All your logged health metrics in one place.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className="export-bar">
            <button className="btn btn-secondary btn-sm" id="history-export-csv" onClick={() => exportCSV(filteredLogs)} title="Export as CSV">
              <Download size={13} /> CSV
            </button>
            <button className="btn btn-secondary btn-sm" id="history-export-pdf" onClick={() => window.print()} title="Print / Save as PDF">
              <Printer size={13} /> PDF
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" id="history-refresh-btn" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/log" className="btn btn-primary btn-sm" id="history-add-btn">+ Log New</Link>
        </div>
      </div>

      {isError && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} /> {error instanceof Error ? error.message : "Failed to load logs"}
        </div>
      )}

      {/* Filter & Search */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs" id="filter-tabs">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`filter-${opt.value.toLowerCase()}`}
              className={`tab-btn ${filter === opt.value ? "active" : ""}`}
              onClick={() => handleFilter(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="form-input-with-icon" style={{ flex: 1, minWidth: 200 }}>
          <span className="form-input-icon"><Search size={15} /></span>
          <input
            id="history-search"
            className="form-input"
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div className="glass-pill" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={12} />
          {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="log-list">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-list-item">
              <div className="skeleton" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "var(--radius-sm)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton skeleton-text" style={{ width: "30%" }} />
                <div className="skeleton skeleton-text" style={{ width: "50%" }} />
              </div>
              <div className="skeleton skeleton-heading" style={{ width: 60 }} />
            </div>
          ))}
        </div>
      ) : pagedLogs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
              <Search size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
            <div className="empty-title">{search ? "No matching logs found" : "No logs yet"}</div>
            <p className="empty-desc">
              {search ? `No logs match "${search}".` : "Start logging your health metrics to see them here."}
            </p>
            {!search && (
              <Link to="/log" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>+ Add First Log</Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="log-list">
            {pagedLogs.map((log, i) => {
              const typeStyle = getTypeStyle(log.type);
              const { primary, unit } = getLogDisplayValue(log);
              return (
                <motion.div
                  key={log.id}
                  className="log-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
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
                    <div className="log-item-number">{primary}</div>
                    <div className="log-item-unit">{unit}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, alignItems: "center" }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Prev
              </button>
              <span className="glass-pill">Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
