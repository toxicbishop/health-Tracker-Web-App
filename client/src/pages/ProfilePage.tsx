import { useAuth } from "../context/AuthContext";
import { useHealthLogs } from "../hooks/useHealthData";
import { LogOut, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: logs = [] } = useHealthLogs();

  const bpCount = logs.filter((l) => l.type === "BLOOD_PRESSURE" || l.type === "BOTH").length;
  const wtCount = logs.filter((l) => l.type === "WEIGHT" || l.type === "BOTH").length;
  const initial = (user?.username ?? "?")[0].toUpperCase();
  const since = user?.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "";

  return (
    <div className="profile-container">
      <nav className="top-nav">
        <button className="top-nav-back" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <span className="top-nav-title">My Account</span>
      </nav>
      
      <div className="page-wrap">
        <div className="profile-header-premium">
          <div className="profile-avatar-large">{initial}</div>
          <h1 className="profile-name">{user?.username ?? "User"}</h1>
          {since && <p className="profile-joined">Healthy since {since}</p>}
        </div>

        <div className="stats-grid-premium">
          <div className="stat-card-p">
            <span className="stat-v">{logs.length}</span>
            <span className="stat-l">Total Logs</span>
          </div>
          <div className="stat-card-p">
            <span className="stat-v">{bpCount}</span>
            <span className="stat-l">BP Checks</span>
          </div>
          <div className="stat-card-p">
            <span className="stat-v">{wtCount}</span>
            <span className="stat-l">Weight Logs</span>
          </div>
        </div>

        <div className="menu-stack-premium">
          <button className="menu-item-p danger" onClick={logout}>
            <LogOut size={20} />
            <span>Sign Out Safely</span>
          </button>
        </div>
      </div>
    </div>
  );
}
