import React, { useState, useEffect, Suspense } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";
import { getDefaultView, getAllowedViews, getComponentById } from "./config/navigationConfig";
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
          margin: "0 auto 10px"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default function App() {
  const { isLoggedIn, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = user?.role || "admin";

  // Default landing view on login
  useEffect(() => {
    if (user?.role) {
      setActiveTab(getDefaultView(user.role));
    }
  }, [user]);

  if (!isLoggedIn) return <Login />;

  // ─── Dynamic component render — NO switch case ────────────────────────────
  const renderActiveView = () => {
    const allowedViews = getAllowedViews(role);
    const currentView = allowedViews.includes(activeTab)
      ? activeTab
      : getDefaultView(role);

    const Component = getComponentById(currentView);
    if (!Component) return null;

    return (
      <Suspense fallback={<ViewLoader />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="main-layout">
        <Header
          title={activeTab}
          setActiveTab={setActiveTab}
          onLogout={logout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="content-wrapper">
          {renderActiveView()}
        </main>
      </div>
    </>
  );
}
