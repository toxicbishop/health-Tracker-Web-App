import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHealthLogs } from "../hooks/useHealthData";
import type {
  HealthLog,
  WeightLog,
  BPLog,
  BothLog,
} from "../types/health";
import {
  Scale,
  Activity,
  Zap,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type FilterType = "ALL" | "WEIGHT" | "BLOOD_PRESSURE" | "BOTH";

function formatDateTime(ts: string) {
  return format(parseISO(ts), "MMM d, yyyy · h:mm a");
}

function getDisplayValue(log: HealthLog): { primary: string; secondary?: string; unit: string } {
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
  if (log.type === "BOTH") {
    const l = log as BothLog;
    return {
      primary: `${l.weight} ${l.unit}`,
      secondary: `${l.systolic}/${l.diastolic} mmHg`,
      unit: "Combined",
    };
  }
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
    case "BOTH":
      return {
        icon: <Zap size={16} />,
        cls: "log-icon-both",
        label: "Full Checkup",
      };
    default:
      return { icon: <Activity size={16} />, cls: "log-icon-wt", label: type };
  }
}

function exportCSV(logs: HealthLog[]) {
  const rows = [["Date", "Type", "Weight", "BP", "Notes"]];
  logs.forEach((log) => {
    let weight = "";
    let bp = "";
    if (log.type === "WEIGHT") weight = `${(log as WeightLog).weight} ${(log as WeightLog).unit}`;
    if (log.type === "BLOOD_PRESSURE") bp = `${(log as BPLog).systolic}/${(log as BPLog).diastolic}`;
    if (log.type === "BOTH") {
      weight = `${(log as BothLog).weight} ${(log as BothLog).unit}`;
      bp = `${(log as BothLog).systolic}/${(log as BothLog).diastolic}`;
    }

    rows.push([
      format(parseISO(log.timestamp), "yyyy-MM-dd HH:mm"),
      log.type,
      weight,
      bp,
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
  { value: "BLOOD_PRESSURE", label: "BP" },
  { value: "BOTH", label: "Checkups" },
];

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const navigate = useNavigate();
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
        const { primary, secondary = "" } = getDisplayValue(log);
        return (
          log.type.toLowerCase().includes(search.toLowerCase()) ||
          primary.includes(search) ||
          secondary.includes(search) ||
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
        <button className="top-nav-back" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <span className="top-nav-title">History</span>
        <div style={{ position: "absolute", right: "1rem", display: "flex", gap: "0.5rem" }}>
          <button className="icon-btn-tan" onClick={() => exportCSV(filtered)}>
            <Download size={18} />
          </button>
          <button className="icon-btn-tan" onClick={() => refetch()}>
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </nav>

      <div className="page-wrap">
        <h1 className="page-title">Health History</h1>
        
        {isError && (
          <div className="alert alert-error">
            <AlertCircle size={15} />{" "}
            {error instanceof Error ? error.message : "Failed to load logs"}
          </div>
        )}

        <div className="search-wrap-premium">
          <Search size={20} className="search-icon-p" />
          <input
            className="search-input-p"
            type="text"
            placeholder="Search notes or values..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-pill-row">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-pill${filter === f.value ? " active" : ""}`}
              onClick={() => handleFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="skeleton-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: 80, marginBottom: "0.75rem" }} />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="empty-state-premium">
            <Search size={48} style={{ opacity: 0.2 }} />
            <p>No records found matching your criteria.</p>
          </div>
        ) : (
          <div className="log-stack">
            {paged.map((log) => {
              const ts = getTypeStyle(log.type);
              const { primary, secondary, unit } = getDisplayValue(log);
              return (
                <div key={log.id} className="history-card">
                  <div className={`history-icon-box ${ts.cls}`}>{ts.icon}</div>
                  <div className="history-info">
                    <div className="history-type-row">
                      <span className="history-label">{ts.label}</span>
                      <span className="history-time">{formatDateTime(log.timestamp)}</span>
                    </div>
                    <div className="history-main-val">
                      {primary} <span className="history-unit">{unit !== "Combined" ? unit : ""}</span>
                    </div>
                    {secondary && <div className="history-sub-val">{secondary}</div>}
                    {log.notes && <p className="history-note">"{log.notes}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-premium">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
