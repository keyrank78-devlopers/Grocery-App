import React from "react";

export default function SettingsView() {
  return (
    <div className="content-section active">
      <div className="page-header">
        <div className="page-header-content">
          <h2>General Settings</h2>
          <p className="text-muted" style={{ marginTop: "4px" }}>Configure store settings and global permissions</p>
        </div>
      </div>
      
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <h3 style={{ marginBottom: "16px" }}>Store Configuration</h3>
        <p className="text-muted">This page is a placeholder for global settings like Store Name, Currency, and Role-based default permissions.</p>
        <p className="text-muted" style={{ marginTop: "12px" }}>Currently, granular permissions can be managed inside the <strong>Staff / Members</strong> section for each individual.</p>
      </div>
    </div>
  );
}
