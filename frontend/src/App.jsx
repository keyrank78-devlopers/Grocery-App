import React, { Suspense, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";
import { NAV_CONFIG, getDefaultPath, getAllowedPaths } from "./config/navigationConfig";
import "./index.css";

// ─── Loading fallback ─────────────────────────────────────────────────────────
function ViewLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
      <div style={{ textAlign: "center", color: "#6c757d" }}>
        <div style={{
          width: "32px", height: "32px",
          border: "3px solid #dee2e6",
          borderTopColor: "#0d6efd",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 10px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Protected Layout ─────────────────────────────────────────────────────────
function AdminLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const role = user?.role || "admin";
  const allowedPaths = getAllowedPaths(role);
  const defaultPath = getDefaultPath(role);
  const location = useLocation();

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="main-layout">
        <Header
          onLogout={logout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="content-wrapper">
          <Suspense fallback={<ViewLoader />}>
            <Routes>
              {/* Root → redirect to default view */}
              <Route path="/" element={<Navigate to={defaultPath} replace />} />

              {/* Render all allowed routes */}
              {NAV_CONFIG.filter((n) => {
                if (role === "admin") return true;
                if (user?.permissions && user.permissions[n.id]) {
                  return !!user.permissions[n.id].canView;
                }
                return n.roles.includes(role);
              }).map((n) => (
                <Route
                  key={n.path}
                  path={n.path}
                  element={<n.component />}
                />
              ))}

              {/* Unauthorized path → redirect to default */}
              <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Login />;

  return <AdminLayout />;
}
