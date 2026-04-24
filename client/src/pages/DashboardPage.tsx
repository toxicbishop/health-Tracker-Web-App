import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHealthLogs } from "../hooks/useHealthData";
import { Scale, Activity, Zap, ClipboardList, TrendingUp } from "lucide-react";
import { format } from "date-fns";

// ── VITAL Logo ──────────────────────────────────────────────────────────────
function VitalLogo() {
  return (
    <svg width="120" height="32" viewBox="0 0 280 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12 L28 66 L48 12" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M4 39 L20 39 L28 18 L36 60 L44 39 L54 39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ opacity: 0.5 }} />
      <line x1="62" y1="12" x2="62" y2="66" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="75" y1="12" x2="105" y2="12" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="90" y1="12" x2="90" y2="66" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M120 66 L140 12 L160 66" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="127" y1="44" x2="153" y2="44" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M174 12 L174 66 L204 66" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: logs = [], isLoading } = useHealthLogs();

  const latestWeight = useMemo(() => logs.find(l => l.type === "WEIGHT" || (l as any).type === "BOTH"), [logs]);
  const latestBP = useMemo(() => logs.find(l => l.type === "BLOOD_PRESSURE" || (l as any).type === "BOTH"), [logs]);

  const todayStr = format(new Date(), "EEEE, MMMM d");

  const ActionButton = ({ icon: Icon, label, sublabel, color, onClick }: any) => (
    <button className="action-card" onClick={onClick} style={{ "--card-accent": color } as any}>
      <div className="action-icon-wrap">
        <Icon size={32} />
      </div>
      <div className="action-text">
        <div className="action-label">{label}</div>
        <div className="action-sublabel">{sublabel}</div>
      </div>
      <Zap size={20} className="action-arrow" />
    </button>
  );

  return (
    <div className="home-container">
      <nav className="top-nav" style={{ border: "none" }}>
        <div className="vital-logo">
          <VitalLogo />
        </div>
      </nav>

      <div className="page-wrap">
        <header className="home-header">
          <h1 className="welcome-text">Mom's Health Tracker</h1>
          <p className="today-date">{todayStr}</p>
        </header>

        <section className="main-actions">
          <ActionButton 
            icon={Scale} 
            label="Log Weight Only" 
            sublabel="Quick weight entry" 
            color="#4A90E2"
            onClick={() => navigate("/log?type=WEIGHT")}
          />
          <ActionButton 
            icon={Activity} 
            label="Log BP Only" 
            sublabel="Systolic & Diastolic" 
            color="#E74C3C"
            onClick={() => navigate("/log?type=BLOOD_PRESSURE")}
          />
          <ActionButton 
            icon={Zap} 
            label="Log Both" 
            sublabel="Weight & Blood Pressure" 
            color="#27AE60"
            onClick={() => navigate("/log?type=BOTH")}
          />
        </section>

        <section className="quick-stats">
          <h2 className="section-title-premium">Recent Measurements</h2>
          <div className="stats-mini-grid">
            <div className="stat-mini-card">
              <span className="stat-mini-label">Last Weight</span>
              <span className="stat-mini-value">
                {isLoading ? "..." : (latestWeight as any)?.weight ? `${(latestWeight as any).weight} kg` : "No data"}
              </span>
            </div>
            <div className="stat-mini-card">
              <span className="stat-mini-label">Last BP</span>
              <span className="stat-mini-value">
                {isLoading ? "..." : (latestBP as any)?.systolic ? `${(latestBP as any).systolic}/${(latestBP as any).diastolic}` : "No data"}
              </span>
            </div>
          </div>
        </section>

        <footer className="home-footer-actions">
          <button className="secondary-action-btn" onClick={() => navigate("/history")}>
            <ClipboardList size={20} />
            <span>View Full History</span>
          </button>
          <button className="secondary-action-btn" onClick={() => navigate("/stats")}>
            <TrendingUp size={20} />
            <span>Health Outlook</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
