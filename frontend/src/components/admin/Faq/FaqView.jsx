import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import MDEditor, { commands } from "@uiw/react-md-editor";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_OPTIONS = ["General", "Delivery", "Payments", "Orders", "Refunds"];

const CAT_COLORS = {
  General:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Delivery: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Payments: { bg: "#fefce8", color: "#ca8a04", border: "#fde68a" },
  Orders:   { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  Refunds:  { bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
};

// ── Add / Edit Inline Form ─────────────────────────────────────────────────────
function FaqForm({ initial, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    question: initial?.question || "",
    answer: initial?.answer || "",
    category: initial?.category || "General",
    displayOrder: initial?.displayOrder ?? "",
  });

  const isEdit = !!initial;

  return (
    <div style={{
      background: "#fff", border: "2px solid #2563eb", borderRadius: "14px",
      padding: "28px 30px", marginBottom: "20px",
      boxShadow: "0 4px 24px rgba(37,99,235,0.10)",
    }}>
      {/* Form Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
          {isEdit ? "✏️" : "➕"}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e3a5f" }}>
            {isEdit ? "Edit FAQ" : "Add New FAQ"}
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
            {isEdit ? "Update the question and answer below" : "Fill in the details for the new FAQ"}
          </p>
        </div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
          Question <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. How fast is delivery?"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Category + Display Order */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#fff" }}
          >
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Display Order</label>
          <input
            type="number" placeholder="e.g. 1" min="0"
            value={form.displayOrder}
            onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Answer — MD Editor */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
          Answer <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <div data-color-mode="light" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #d1d5db" }}>
          <MDEditor
            value={form.answer}
            onChange={(val) => setForm({ ...form, answer: val || "" })}
            height={240}
            visibleDragbar={false}
            preview="edit"
            commands={[
              commands.bold, commands.italic, commands.strikethrough,
              commands.divider,
              commands.title2, commands.title3,
              commands.divider,
              commands.unorderedListCommand, commands.orderedListCommand,
              commands.divider,
              commands.quote, commands.code,
              commands.divider,
              commands.link,
            ]}
            extraCommands={[commands.codePreview, commands.livePreview]}
          />
        </div>
        <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af" }}>
          Supports Markdown — **bold**, *italic*, ## Heading, - list
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button" onClick={onCancel} disabled={isSaving}
          style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#f9fafb", color: "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving || !form.question.trim() || !form.answer.trim()}
          onClick={() => onSave(form)}
          style={{
            padding: "9px 22px", borderRadius: "8px", border: "none",
            background: isSaving || !form.question.trim() || !form.answer.trim() ? "#93c5fd" : "#2563eb",
            color: "#fff", fontWeight: 600, fontSize: "13px",
            cursor: isSaving || !form.question.trim() || !form.answer.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add FAQ"}
        </button>
      </div>
    </div>
  );
}

// ── Main FaqView ───────────────────────────────────────────────────────────────
export default function FaqView() {
  const { showToast } = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteFaq, setDeleteFaq] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Fetch
  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/faqs`, { withCredentials: true });
      setFaqs(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load FAQs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // Filter
  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchSearch = !q || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
      const matchCat = !categoryFilter || f.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [faqs, search, categoryFilter]);

  // Add
  const handleAdd = async (form) => {
    setIsAdding(true);
    try {
      const res = await axios.post(`${BASE_URL}/faqs/admin`, {
        question: form.question.trim(), answer: form.answer.trim(),
        category: form.category,
        displayOrder: form.displayOrder ? parseInt(form.displayOrder) : 0,
      }, { withCredentials: true });
      setFaqs((prev) => [res.data.data, ...prev]);
      setShowAddForm(false);
      showToast("FAQ added successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add FAQ", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // Edit
  const handleEdit = async (form) => {
    setIsEditing(true);
    try {
      const isTransient = !editingId.match(/^[0-9a-fA-F]{24}$/);
      if (isTransient) {
        // Create the FAQ in database on edit save
        const res = await axios.post(`${BASE_URL}/faqs/admin`, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          displayOrder: form.displayOrder ? parseInt(form.displayOrder) : 0,
        }, { withCredentials: true });
        
        // Replace transient FAQ in UI list with the saved DB item
        setFaqs((prev) => [res.data.data, ...prev.filter((f) => (f._id || f.question) !== editingId)]);
        setEditingId(null);
        showToast("FAQ saved to database!", "success");
      } else {
        const res = await axios.put(`${BASE_URL}/faqs/admin/${editingId}`, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          displayOrder: form.displayOrder ? parseInt(form.displayOrder) : 0,
        }, { withCredentials: true });
        setFaqs((prev) => prev.map((f) => f._id === editingId ? res.data.data : f));
        setEditingId(null);
        showToast("FAQ updated!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update FAQ", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteFaq) return;
    if (!deleteFaq._id) {
      // Seeded mock FAQ doesn't exist in DB, just remove it from UI state
      setFaqs((prev) => prev.filter((f) => f.question !== deleteFaq.question));
      setDeleteFaq(null);
      showToast("FAQ deleted locally!", "success");
      return;
    }
    setDeletingId(deleteFaq._id);
    try {
      await axios.delete(`${BASE_URL}/faqs/admin/${deleteFaq._id}`, { withCredentials: true });
      setFaqs((prev) => prev.filter((f) => f._id !== deleteFaq._id));
      setDeleteFaq(null);
      showToast("FAQ deleted!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete FAQ", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle
  const handleToggle = async (faq) => {
    if (togglingId) return;
    const identifier = faq._id || faq.question;
    setTogglingId(identifier);
    try {
      if (!faq._id) {
        // Create in DB with toggled status
        const res = await axios.post(`${BASE_URL}/faqs/admin`, {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          displayOrder: faq.displayOrder || 0,
          isActive: !faq.isActive,
        }, { withCredentials: true });

        // Update list
        setFaqs((prev) => [res.data.data, ...prev.filter((f) => f.question !== faq.question)]);
        showToast(`FAQ ${res.data.data.isActive ? "activated" : "deactivated"}`, "success");
      } else {
        const res = await axios.patch(`${BASE_URL}/faqs/admin/${faq._id}/toggle-status`, {}, { withCredentials: true });
        setFaqs((prev) => prev.map((f) => f._id === faq._id ? res.data.data : f));
        showToast(`FAQ ${res.data.data.isActive ? "activated" : "deactivated"}`, "success");
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="content-section active" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center", color: "#6c757d" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px" }}>Loading FAQs...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="page-header-content">
          <h2>FAQ Management</h2>
          <p className="page-subtitle">Manage frequently asked questions displayed to customers</p>
        </div>
        {!showAddForm && (
          <button
            className="btn btn-primary"
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ fontSize: "16px" }}>+</span> Add FAQ
          </button>
        )}
      </div>

      {/* ── Inline Add Form ── */}
      {showAddForm && (
        <FaqForm initial={null} onSave={handleAdd} onCancel={() => setShowAddForm(false)} isSaving={isAdding} />
      )}

      {/* ── Stats + Filter Bar ── */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Category Chips */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = faqs.filter((f) => f.category === cat).length;
            const active = categoryFilter === cat;
            const c = CAT_COLORS[cat] || {};
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(active ? "" : cat)}
                style={{
                  padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                  cursor: "pointer", border: `1px solid ${active ? c.color : c.border}`,
                  background: active ? c.color : c.bg,
                  color: active ? "#fff" : c.color,
                  transition: "all 0.15s",
                }}
              >
                {cat} <span style={{ opacity: 0.75 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" }}
          />
          <svg width="15" height="15" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px" }}
            >×</button>
          )}
        </div>

        {(search || categoryFilter) && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter(""); }}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#f9fafb", color: "#6b7280", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Count Line ── */}
      <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "14px" }}>
        Showing <strong style={{ color: "#374151" }}>{filteredFaqs.length}</strong> of <strong style={{ color: "#374151" }}>{faqs.length}</strong> FAQs
      </p>

      {/* ── FAQ Accordion List ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredFaqs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", color: "#9ca3af" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🤔</div>
            <p style={{ fontWeight: 600, color: "#374151", marginBottom: "4px" }}>No FAQs found</p>
            <p style={{ fontSize: "13px" }}>Try adjusting your search or category filter</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const catColor = CAT_COLORS[faq.category] || CAT_COLORS.General;
            const isExpanded = expandedId === (faq._id || faq.question);
            const isEditingThis = editingId === (faq._id || faq.question);

            return (
              <div key={faq._id || faq.question}>
                {isEditingThis ? (
                  <FaqForm
                    initial={faq}
                    onSave={handleEdit}
                    onCancel={() => setEditingId(null)}
                    isSaving={isEditing}
                  />
                ) : (
                  <div style={{
                    background: "#fff",
                    border: `1px solid ${isExpanded ? "#bfdbfe" : "#e5e7eb"}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: isExpanded ? "0 2px 12px rgba(37,99,235,0.08)" : "none",
                  }}>

                    {/* ── Question Row (Clickable) ── */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : (faq._id || faq.question))}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        padding: "15px 18px", cursor: "pointer",
                        background: isExpanded ? "#f8faff" : "#fff",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Order Badge */}
                      <div style={{
                        minWidth: "30px", height: "30px", borderRadius: "8px",
                        background: "#f1f5f9", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "11px", fontWeight: 700,
                        color: "#64748b", flexShrink: 0,
                      }}>
                        {faq.displayOrder !== undefined && faq.displayOrder !== null ? faq.displayOrder : "—"}
                      </div>

                      {/* Question + Category */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 5px", fontWeight: 600, fontSize: "14px", color: "#111827", lineHeight: 1.4 }}>
                          {faq.question}
                        </p>
                        <span style={{
                          display: "inline-block", fontSize: "11px", fontWeight: 700,
                          padding: "2px 10px", borderRadius: "10px",
                          background: catColor.bg, color: catColor.color, border: `1px solid ${catColor.border}`,
                        }}>
                          {faq.category || "General"}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span style={{
                        flexShrink: 0, fontSize: "11px", fontWeight: 700,
                        padding: "3px 10px", borderRadius: "10px",
                        background: faq.isActive ? "#dcfce7" : "#fee2e2",
                        color: faq.isActive ? "#16a34a" : "#dc2626",
                        border: `1px solid ${faq.isActive ? "#bbf7d0" : "#fecaca"}`,
                      }}>
                        {faq.isActive ? "Active" : "Inactive"}
                      </span>

                      {/* Chevron */}
                      <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"
                        style={{ flexShrink: 0, transition: "transform 0.25s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* ── Answer Panel (Expanded) ── */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #e5e7eb", padding: "18px 20px 16px" }}>
                        {/* Answer Preview */}
                        <div data-color-mode="light" style={{ marginBottom: "16px", padding: "14px 16px", background: "#f9fafb", borderRadius: "8px", fontSize: "14px", lineHeight: 1.7 }}>
                          <MDEditor.Markdown
                            source={faq.answer}
                            style={{ background: "transparent", color: "#374151", fontSize: "14px" }}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            onClick={() => { setEditingId(faq._id || faq.question); setExpandedId(null); }}
                            style={{ padding: "6px 16px", borderRadius: "7px", border: "1px solid #d1d5db", background: "#f9fafb", color: "#374151", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleToggle(faq)}
                            disabled={togglingId === faq._id}
                            style={{
                              padding: "6px 16px", borderRadius: "7px", fontWeight: 600, fontSize: "12px", cursor: "pointer",
                              border: `1px solid ${faq.isActive ? "#fecaca" : "#bbf7d0"}`,
                              background: faq.isActive ? "#fff1f2" : "#f0fdf4",
                              color: faq.isActive ? "#dc2626" : "#16a34a",
                            }}
                          >
                            {togglingId === faq._id ? "Updating..." : faq.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setDeleteFaq(faq)}
                            disabled={deletingId === faq._id}
                            style={{ padding: "6px 16px", borderRadius: "7px", border: "1px solid #fecaca", background: "#fff1f2", color: "#dc2626", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                          >
                            {deletingId === faq._id ? "Deleting..." : "🗑️ Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteFaq} onClose={() => setDeleteFaq(null)} title="Delete FAQ">
        <div style={{ textAlign: "center", padding: "10px 0 24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 16px" }}>
            🗑️
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>
            Delete this FAQ?
          </p>
          <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", margin: "0 0 6px" }}>
            "{deleteFaq?.question}"
          </p>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>This action cannot be undone.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => setDeleteFaq(null)}
            disabled={!!deletingId}
            style={{ padding: "9px 20px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#f9fafb", color: "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!!deletingId}
            style={{ padding: "9px 22px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            {deletingId ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
