import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  categories: "Categories",
  subcategories: "Subcategories",
  products: "Products",
  orders: "Orders",
  staff: "Staff Management",
  banners: "Banners",
  warehouses: "Warehouses",
  coupons: "Coupons",
  profile: "My Profile",
};

const formatRole = (role) => {
  if (!role) return "Staff";
  if (role === "admin") return "Super Admin";
  return role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

export default function Header({ title, setActiveTab, onLogout, onToggleSidebar }) {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = PAGE_TITLES[title] || title;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, [dropdownOpen]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="top-header">
      <style>{`
        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: none;
          padding: 10px 16px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #495057;
          transition: all 0.2s;
        }
        .header-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #0d6efd;
        }
        .header-dropdown-item.text-danger:hover {
          background-color: #fff5f5;
          color: #dc3545;
        }
      `}</style>

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

        {/* Profile Dropdown */}
        <div style={{ position: "relative", display: "inline-block", marginLeft: "12px" }}>
          <div
            onClick={toggleDropdown}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover no-repeat` : "linear-gradient(135deg, #4f46e5 0%, #0d6efd 100%)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "14px", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(13, 110, 253, 0.15)",
              userSelect: "none"
            }}
          >
            {!user?.avatarUrl && avatarLetter}
          </div>

          {dropdownOpen && (
            <div style={{
              position: "absolute", right: 0, top: "44px", width: "220px",
              backgroundColor: "#fff", border: "1px solid #eef0f3", borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)", zIndex: 1000,
              padding: "8px 0"
            }}>
              <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f1f3f6", marginBottom: "4px" }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#212529", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.name || "Admin User"}
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                  {user?.email || ""}
                </div>
              </div>

              {user?.role === "admin" && setActiveTab && (
                <button
                  className="header-dropdown-item"
                  onClick={() => setActiveTab("profile")}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
              )}

              <button className="header-dropdown-item text-danger" onClick={onLogout}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
