import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, ClipboardList } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { to: "/log", label: "Log", icon: <PlusCircle size={20} /> },
  { to: "/history", label: "History", icon: <ClipboardList size={20} /> },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? " active" : ""}`
          }>
          {item.icon}
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
