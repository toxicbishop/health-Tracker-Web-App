import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  LogOut,
  HeartPulse,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { to: "/log", label: "Log Health", icon: <PlusCircle size={17} /> },
  { to: "/history", label: "History", icon: <ClipboardList size={17} /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <HeartPulse size={20} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          HealthTracker
          <span>Wellness Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-section-label">Menu</div>
      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Theme Toggle + User */}
      <div className="sidebar-bottom">
        {/* Theme Toggle */}
        <div style={{ marginBottom: 12 }}>
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{ width: "100%", justifyContent: "flex-start", gap: 10 }}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>

        <div className="user-chip">
          <div className="user-avatar">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username ?? "User"}</div>
            <div className="user-role">Member</div>
          </div>
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={logout}
            title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

