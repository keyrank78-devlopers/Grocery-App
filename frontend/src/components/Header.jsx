import React from "react";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  categories: "Categories",
  subcategories: "Subcategories",
  products: "Products",
  orders: "Orders",
  staff: "Staff Management",
};

const formatRole = (role) => {
  if (!role) return "Staff";
  if (role === "admin") return "Super Admin";
  return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

export default function Header({ title, onLogout, onToggleSidebar }) {
  const { user } = useAuth();
  const pageTitle = PAGE_TITLES[title] || title;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="mobile-toggle-btn" onClick={onToggleSidebar} aria-label="Open menu">
          <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

      </div>

      <div className="header-right">
        {user?.role && (
          <span className="header-role-badge">{formatRole(user.role)}</span>
        )}
        <div className="status-pill">
          <span className="status-indicator"></span>
          Online
        </div>
        <span className="status-text">{dateStr}</span>
        <button className="btn btn-ghost btn-sm" id="logout-btn" onClick={onLogout}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  );
}
