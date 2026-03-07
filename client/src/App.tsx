import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LogPage from "./pages/LogPage";
import HistoryPage from "./pages/HistoryPage";
import { useHealthLogs } from "./hooks/useHealthData";
import { Home, PenLine, ClipboardList, User, LogOut } from "lucide-react";
import { format } from "date-fns";

// ── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: logs = [] } = useHealthLogs();

  const bpCount = logs.filter((l) => l.type === "BLOOD_PRESSURE").length;
  const wtCount = logs.filter((l) => l.type === "WEIGHT").length;
  const hrCount = logs.filter((l) => l.type === "HEART_RATE").length;
  const initial = (user?.username ?? "?")[0].toUpperCase();
  const since = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "";

  return (
    <div>
      <nav className="top-nav">
        <span className="top-nav-title">Profile</span>
      </nav>
      <div className="profile-section">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-username">{user?.username ?? "—"}</div>
        {since && <div className="profile-since">Member since {since}</div>}

        {/* Stats */}
        <div className="profile-stat-grid">
          <div className="profile-stat">
            <div className="profile-stat-val">{logs.length}</div>
            <div className="profile-stat-label">Total Logs</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{bpCount + wtCount}</div>
            <div className="profile-stat-label">Vitals</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{hrCount}</div>
            <div className="profile-stat-label">Heart Rate</div>
          </div>
        </div>

        {/* Menu */}
        <div className="card" style={{ padding: "0 0.25rem" }}>
          <button className="profile-menu-item danger" onClick={logout}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Tab Bar ───────────────────────────────────────────────────────────
const TABS = [
  { path: "/", label: "Home", Icon: Home },
  { path: "/log", label: "Log", Icon: PenLine },
  { path: "/history", label: "History", Icon: ClipboardList },
  { path: "/profile", label: "Profile", Icon: User },
];

function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="bottom-tabs">
      {TABS.map(({ path, label, Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            className={`tab-item${active ? " active" : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}>
            <Icon size={22} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/log" element={<LogPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading VITAL…</span>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="app-shell">
      <main className="main-content">
        <AppRoutes />
      </main>
      <BottomTabs />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
