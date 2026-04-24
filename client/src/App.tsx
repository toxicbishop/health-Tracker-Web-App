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
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import { Home, PenLine, ClipboardList, User } from "lucide-react";

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
      <Route path="/stats" element={<StatsPage />} />
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
