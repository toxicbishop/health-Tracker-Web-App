import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  LogOut,
  HeartPulse,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { to: "/log", label: "Log Health", icon: <PlusCircle size={17} /> },
  { to: "/history", label: "History", icon: <ClipboardList size={17} /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

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

      {/* User */}
      <div className="sidebar-bottom">
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
