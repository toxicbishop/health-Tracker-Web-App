import { useState, useMemo } from "react";
import { useHealthLogs } from "../hooks/useHealthData";
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
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type FilterType = "ALL" | "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

function formatDateTime(ts: string) {
  return format(parseISO(ts), "MMM d, yyyy · h:mm a");
}

function getDisplayValue(log: HealthLog): { primary: string; unit: string } {
  if (log.type === "WEIGHT")
    return {
      primary: `${(log as WeightLog).weight}`,
      unit: (log as WeightLog).unit,
    };
  if (log.type === "BLOOD_PRESSURE")
    return {
      primary: `${(log as BPLog).systolic}/${(log as BPLog).diastolic}`,
      unit: "mmHg",
    };
  if (log.type === "HEART_RATE")
    return { primary: `${(log as HeartRateLog).bpm}`, unit: "bpm" };
  return { primary: "—", unit: "" };
}

function getTypeStyle(type: string) {
  switch (type) {
    case "WEIGHT":
      return { icon: <Scale size={16} />, cls: "log-icon-wt", label: "Weight" };
    case "BLOOD_PRESSURE":
      return {
        icon: <Activity size={16} />,
        cls: "log-icon-bp",
        label: "Blood Pressure",
      };
    case "HEART_RATE":
      return {
        icon: <HeartPulse size={16} />,
        cls: "log-icon-hr",
        label: "Heart Rate",
      };
    default:
      return { icon: <Activity size={16} />, cls: "log-icon-wt", label: type };
  }
}

function exportCSV(logs: HealthLog[]) {
  const rows = [["Date", "Type", "Value", "Unit", "Notes"]];
  logs.forEach((log) => {
    const { primary, unit } = getDisplayValue(log);
    rows.push([
      format(parseISO(log.timestamp), "yyyy-MM-dd HH:mm"),
      log.type,
      primary,
      unit,
      log.notes ?? "",
    ]);
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

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WEIGHT", label: "Weight" },
  { value: "BLOOD_PRESSURE", label: "Blood Pressure" },
  { value: "HEART_RATE", label: "Heart Rate" },
];

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const {
    data: logs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useHealthLogs();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [logs],
  );

  const filtered = useMemo(
    () =>
      sorted.filter((log) => {
        if (filter !== "ALL" && log.type !== filter) return false;
        if (!search) return true;
        const { primary } = getDisplayValue(log);
        return (
          log.type.toLowerCase().includes(search.toLowerCase()) ||
          primary.includes(search) ||
          (log.notes ?? "").toLowerCase().includes(search.toLowerCase()) ||
          formatDateTime(log.timestamp)
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      }),
    [sorted, filter, search],
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };
  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(1);
  };

  return (
    <div>
      <nav className="top-nav">
        <span className="top-nav-title">Health History</span>
        <div
          style={{
            position: "absolute",
            right: "1rem",
            display: "flex",
            gap: "0.35rem",
          }}>
          <button
            className="btn-sm"
            id="history-export-csv"
            onClick={() => exportCSV(filtered)}
            title="Export CSV">
            <Download size={13} />
          </button>
          <button
            className="btn-sm"
            id="history-refresh-btn"
            onClick={() => refetch()}
            title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>
      </nav>

      <div className="page-wrap">
        <h1 className="page-title-left">All Entries</h1>
        <p className="page-subtitle">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </p>

        {isError && (
          <div className="alert alert-error">
            <AlertCircle size={15} />{" "}
            {error instanceof Error ? error.message : "Failed to load logs"}
          </div>
        )}

        {/* Filter tabs */}
        <div className="filter-bar" id="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              id={`filter-${f.value.toLowerCase()}`}
              className={`filter-tab${filter === f.value ? " active" : ""}`}
              onClick={() => handleFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="search-wrap">
          <span className="search-icon">
            <Search size={15} />
          </span>
          <input
            id="history-search"
            className="search-input"
            type="text"
            placeholder="Search entries…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 60, borderRadius: 8 }}
              />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="empty-state">
            <Search size={32} />
            <div className="empty-title">
              {search ? "No matching entries" : "No entries yet"}
            </div>
            <p className="empty-desc">
              {search
                ? `No results for "${search}".`
                : "Log health metrics to see them here."}
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="log-list">
              {paged.map((log) => {
                const ts = getTypeStyle(log.type);
                const { primary, unit } = getDisplayValue(log);
                return (
                  <div key={log.id} className="log-row">
                    <div className={`log-icon ${ts.cls}`}>{ts.icon}</div>
                    <div className="log-body">
                      <div className="log-type">{ts.label}</div>
                      <div className="log-date">
                        {formatDateTime(log.timestamp)}
                      </div>
                      {log.notes && (
                        <div className="log-notes">"{log.notes}"</div>
                      )}
                    </div>
                    <div className="log-value">
                      <div className="log-num">{primary}</div>
                      <div className="log-unit">{unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
