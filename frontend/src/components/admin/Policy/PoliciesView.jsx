import React, { useState, useEffect } from "react";
import axios from "axios";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const POLICY_TYPES = [
  { id: "about_us", label: "About Us", icon: "ℹ️", defaultTitle: "About Us" },
  { id: "privacy_policy", label: "Privacy Policy", icon: "🔒", defaultTitle: "Privacy Policy" },
  { id: "terms_conditions", label: "Terms & Conditions", icon: "📄", defaultTitle: "Terms & Conditions" },
  { id: "refund_policy", label: "Refund Policy", icon: "🔄", defaultTitle: "Refund & Return Policy" },
  { id: "shipping_policy", label: "Shipping Policy", icon: "🚚", defaultTitle: "Shipping & Delivery Policy" },
];

export default function PoliciesView() {
  const { showToast } = useToast();

  const [activeType, setActiveType] = useState("about_us");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch the selected policy
  const fetchPolicy = async (type) => {
    setLoading(true);
    setLastUpdated(null);
    setUpdatedBy(null);

    const config = POLICY_TYPES.find((p) => p.id === type);

    try {
      const res = await axios.get(`${BASE_URL}/policies/${type}`, {
        withCredentials: true,
      });

      const policyData = res.data.data;
      if (policyData) {
        setTitle(policyData.title || config.defaultTitle);
        setContent(policyData.content || "");
        setLastUpdated(policyData.updatedAt || null);
        setUpdatedBy(policyData.updatedBy || null);
      } else {
        // Fallback if empty data
        setTitle(config.defaultTitle);
        setContent("");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // Policy does not exist yet - initialize as blank/new form
        setTitle(config.defaultTitle);
        setContent("");
      } else {
        console.error(err);
        showToast("Failed to load policy content", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(activeType);
  }, [activeType]);

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("Please fill in both title and content", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/policies`,
        {
          type: activeType,
          title: title.trim(),
          content: content.trim(),
        },
        { withCredentials: true }
      );

      showToast("Policy saved successfully!", "success");
      // Update local audit metadata
      if (res.data.data) {
        setLastUpdated(res.data.data.updatedAt);
        setUpdatedBy(res.data.data.updatedBy);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to save policy", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-section active">
      {/* CSS overrides to force editor content text visibility and page layout layout */}
      <style>{`
        /* ── Markdown Editor: force light mode visually ── */
        [data-color-mode="light"] .w-md-editor {
          background: #ffffff !important;
          color: #1f2937 !important;
          box-shadow: none !important;
        }
        /* textarea must stay transparent (MDEditor layers pre on top) */
        [data-color-mode="light"] .w-md-editor-text-input textarea {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          caret-color: #1f2937 !important;
        }
        /* The visible pre layer must be dark */
        [data-color-mode="light"] .w-md-editor-text-pre,
        [data-color-mode="light"] .w-md-editor-text-pre > code,
        [data-color-mode="light"] .w-md-editor-text-pre * {
          color: #1f2937 !important;
          -webkit-text-fill-color: #1f2937 !important;
          background: transparent !important;
        }
        /* Hide the resize bar and empty preview pane */
        [data-color-mode="light"] .w-md-editor-bar,
        [data-color-mode="light"] .w-md-editor-preview { display: none !important; }
        /* Edit pane fills full height */
        [data-color-mode="light"] .w-md-editor-text { height: 100% !important; }
        .pol-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .pol-sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 8px;
        }
        .pol-tab-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          color: #4b5563;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .pol-tab-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        .pol-tab-btn.active {
          background: #eff6ff;
          color: #2563eb;
        }
        .pol-editor-card {
          flex: 1;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px 28px;
        }
        .pol-form-group {
          margin-bottom: 20px;
        }
        .pol-form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 6px;
        }
        .pol-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          font-weight: 600;
          color: #1f2937;
        }
        .pol-input:focus {
          border-color: #3b82f6;
        }
        .pol-audit-text {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="page-header-content">
          <h2>Policy Management</h2>
          <p className="page-subtitle">Configure terms, conditions, privacy policy and store pages</p>
        </div>
      </div>

      <div className="pol-layout">
        {/* Sidebar Selector */}
        <div className="pol-sidebar">
          {POLICY_TYPES.map((pt) => (
            <button
              key={pt.id}
              className={`pol-tab-btn ${activeType === pt.id ? "active" : ""}`}
              onClick={() => setActiveType(pt.id)}
            >
              <span style={{ fontSize: "16px" }}>{pt.icon}</span>
              {pt.label}
            </button>
          ))}
        </div>

        {/* Editor Form */}
        <div className="pol-editor-card">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px" }}>
              <div style={{ textAlign: "center", color: "#6c757d" }}>
                <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px" }}>Loading policy data...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    Configure {POLICY_TYPES.find((p) => p.id === activeType)?.label}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                    Update title and body structure displayed to app clients
                  </p>
                </div>

                {/* Audit meta details */}
                {lastUpdated && (
                  <div style={{ textAlign: "right" }}>
                    <p className="pol-audit-text">
                      Last updated: <strong>{new Date(lastUpdated).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                    </p>
                    {updatedBy && (
                      <p className="pol-audit-text">
                        By: <strong>{updatedBy.name || updatedBy.email || "Administrator"}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Title input */}
              <div className="pol-form-group">
                <label>Page Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="pol-input"
                  placeholder="e.g. Terms & Conditions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Content markdown editor */}
              <div className="pol-form-group">
                <label>Page Content <span className="text-danger">*</span></label>
                <div data-color-mode="light" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #d1d5db" }}>
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || "")}
                    height={380}
                    visibleDragbar={false}
                    preview="edit"
                    commands={[
                      commands.bold, commands.italic, commands.strikethrough,
                      commands.divider,
                      commands.title1, commands.title2, commands.title3,
                      commands.divider,
                      commands.unorderedListCommand, commands.orderedListCommand,
                      commands.divider,
                      commands.quote, commands.code, commands.codeBlock,
                      commands.divider,
                      commands.link, commands.table,
                    ]}
                    extraCommands={[commands.codePreview, commands.livePreview]}
                  />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af" }}>
                  Supports Markdown styling — ## Headings, **bold**, *italic*, - list elements, tables, and links
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !content.trim()}
                  style={{
                    padding: "10px 24px", borderRadius: "8px", border: "none",
                    background: saving || !title.trim() || !content.trim() ? "#93c5fd" : "#2563eb",
                    color: "#fff", fontWeight: 700, fontSize: "14px",
                    cursor: saving || !title.trim() || !content.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving changes..." : "💾 Save Policy"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
