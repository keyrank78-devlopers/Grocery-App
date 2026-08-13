import React from "react";
import { MOCK_STATS, MOCK_ACTIVITY_LOGS } from "../mockData";
import { useAuth } from "../context/AuthContext";

const STAT_ICONS = [
  { class: "indigo", icon: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
  { class: "emerald", icon: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )},
  { class: "amber", icon: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  )},
  { class: "sky", icon: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
];

export default function DashboardView() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const today = new Date();
  const dayStr = today.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="content-section active">
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <h2>Welcome back, {firstName} 👋</h2>
          <p>Here's what's happening with your store today. Monitor sales, inventory, and operations at a glance.</p>
        </div>
        <div className="dashboard-welcome-date">
          <div className="day">{dayStr}</div>
          <div className="date">{dateStr}</div>
        </div>
      </div>

      <div className="stats-grid">
        {MOCK_STATS.map((stat, idx) => (
          <div key={idx} className="stats-card">
            <div className="stats-card-top">
              <div>
                <span className="stats-label">{stat.label}</span>
                <h3 className="stats-value">{stat.value}</h3>
              </div>
              <div className={`stats-icon ${STAT_ICONS[idx]?.class || "indigo"}`}>
                {STAT_ICONS[idx]?.icon}
              </div>
            </div>
            <span className={`stats-trend ${stat.type === 'positive' ? 'positive' : stat.type === 'warning' ? 'warning' : 'neutral'}`}>
              {stat.type === 'positive' && '↑ '}
              {stat.type === 'warning' && '⚠ '}
              {stat.trend}
            </span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card table-card">
          <div className="card-header">
            <h3>Recent System Activity</h3>
            <span className="badge badge-success">Live</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Module</th>
                <th>Action Details</th>
                <th>Operator</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVITY_LOGS.map((log, idx) => (
                <tr key={idx}>
                  <td><span className="activity-time">{log.time}</span></td>
                  <td><span className="activity-module">{log.module}</span></td>
                  <td>{log.action}</td>
                  <td>{log.operator}</td>
                  <td>
                    <span className={`badge ${log.badge === 'success' ? 'badge-success' : 'badge-error'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-side-panel">
          <div className="card quick-actions-card">
            <h4>Quick Actions</h4>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" type="button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Product
              </button>
              <button className="quick-action-btn" type="button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                View Orders
              </button>
              <button className="quick-action-btn" type="button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Categories
              </button>
              <button className="quick-action-btn" type="button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Add Staff
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Today's Summary</h4>
            <p className="text-muted text-sm" style={{ marginBottom: "16px" }}>Store performance overview</p>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Orders Today</span>
              <span className="summary-stat-value">48</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Revenue Today</span>
              <span className="summary-stat-value">₹24,680</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Low Stock Items</span>
              <span className="summary-stat-value text-danger">7</span>
            </div>
            <div className="summary-stat-row">
              <span className="summary-stat-label">Active Staff</span>
              <span className="summary-stat-value">11</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
