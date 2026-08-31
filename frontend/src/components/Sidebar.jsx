import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/image/Keyrank-Logo.png";
import { useAuth } from "../context/AuthContext";
import { NAV_CONFIG } from "../config/navigationConfig";

const formatRole = (role) => {
  if (!role) return "Staff";
  if (role === "admin") return "Super Admin";
  return role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role || "admin";
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  // Role & Permissions ke hisaab se filter + section group
  const allowedItems = NAV_CONFIG.filter((item) => {
    if (role === "admin") return true;
    
    if (user?.permissions) {
      return !!user.permissions[item.id]?.canView;
    }
    
    return item.roles.includes(role);
  });
  const sections = allowedItems.reduce((acc, item) => {
    const existing = acc.find((s) => s.label === item.section);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ label: item.section, items: [item] });
    }
    return acc;
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-logo-wrap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logo}
              alt="Keyrank"
              className="sidebar-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="sidebar-app-name">Keyrank</span>
          </div>
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-menu">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div
            className="user-avatar"
            style={user?.avatarUrl ? { background: `url(${user.avatarUrl}) center/cover no-repeat`, boxShadow: "none" } : {}}
          >
            {!user?.avatarUrl && avatarLetter}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || "Admin User"}</span>
            <span className="user-role">{formatRole(role)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
