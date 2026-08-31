import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CreateStuff from "./CreateStuff";
import PermissionsMatrix from "./PermissionsMatrix";
import { useToast } from "../../../context/ToastContext";
import "./stuff.css";

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const PowerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "sub_admin", label: "Sub Admin" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "agent", label: "Delivery/Support Agent" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Suspended", label: "Suspended" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25];

const formatRole = (role) => {
  const labels = {
    agent: "Delivery/Support Agent",
    warehouse_manager: "Warehouse Manager",
    accountant: "Accountant",
    sub_admin: "Sub Admin",
    admin: "Super Admin",
  };
  return labels[role] || role.replace(/_/g, " ");
};

const getInitials = (name) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ member, onClose, onSave }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: member.name || "",
    email: member.email || "",
    phone: member.mobile || "",
    role: member.role || "",
  });
  const [permissions, setPermissions] = useState(member.permissions || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/admin/staff/${member.id}`,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          permissions
        },
        { withCredentials: true }
      );
      showToast("Staff member updated successfully!", "success");
      onSave(response.data.data);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update staff member";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "12px",
        padding: "32px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Edit Staff Member</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6c757d" }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name <span className="text-danger">*</span></label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email Address <span className="text-danger">*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number <span className="text-danger">*</span></label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Role <span className="text-danger">*</span></label>
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="">Select Role</option>
              <option value="sub_admin">Sub Admin</option>
              <option value="warehouse_manager">Warehouse Manager</option>
              <option value="accountant">Accountant</option>
              <option value="agent">Delivery/Support Agent</option>
            </select>
          </div>
          
          <div style={{ marginTop: "20px" }}>
            <PermissionsMatrix permissions={permissions} setPermissions={setPermissions} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main StaffView ────────────────────────────────────────────────────────────
export default function StaffView() {
  const { showToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/admin/get-staff`, { withCredentials: true });
      setStaff(response.data.data || []);
    } catch (error) {
      console.error(error);
      showToast("Failed to load staff members", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // ── Toggle Status ───────────────────────────────────────────────────────
  const handleToggleStatus = async (member) => {
    if (togglingId) return;
    setTogglingId(member.id);
    try {
      const response = await axios.patch(
        `${BASE_URL}/admin/staff/${member.id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const updated = response.data.data;
      setStaff((prev) =>
        prev.map((m) => m.id === updated.id ? { ...m, status: updated.status } : m)
      );
      showToast(`Staff member ${updated.status === "Active" ? "activated" : "suspended"} successfully`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Edit Save ───────────────────────────────────────────────────────────
  const handleEditSave = (updatedMember) => {
    setStaff((prev) =>
      prev.map((m) => m.id === updatedMember.id ? { ...m, ...updatedMember } : m)
    );
    setEditingMember(null);
  };

  // ── Create Success ──────────────────────────────────────────────────────
  const handleCreateSuccess = (newMember) => {
    const formatted = {
      id: newMember.staff_id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      mobile: newMember.phone,
      city: newMember.address?.city || "",
      status: "Active",
    };
    setStaff((prev) => [formatted, ...prev]);
    setIsCreating(false);
    setPage(1);
  };

  // ── Filter ──────────────────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query) ||
        member.mobile.includes(query) ||
        (member.email && member.email.toLowerCase().includes(query)) ||
        (member.city && member.city.toLowerCase().includes(query));
      const matchesRole = !roleFilter || member.role === roleFilter;
      const matchesStatus = !statusFilter || member.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, search, roleFilter, statusFilter]);

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedStaff = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, safePage, pageSize]);

  const rangeStart = filteredStaff.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filteredStaff.length);
  const hasActiveFilters = search || roleFilter || statusFilter;

  const clearFilters = () => { setSearch(""); setRoleFilter(""); setStatusFilter(""); setPage(1); };

  // ── Views ───────────────────────────────────────────────────────────────
  if (isCreating) {
    return <CreateStuff onCancel={() => setIsCreating(false)} onSuccess={handleCreateSuccess} />;
  }

  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{
              width: "36px", height: "36px", border: "3px solid #dee2e6",
              borderTopColor: "#0d6efd", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
            }} />
            <p style={{ fontSize: "14px" }}>Loading staff members...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Edit Modal */}
      {editingMember && (
        <EditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleEditSave}
        />
      )}

      <div className="content-section active">
        <div className="page-header">
          <div className="page-header-content">
            <h2>Staff & User Management</h2>

          </div>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            + Add Member
          </button>
        </div>

        <div className="card staff-table-card">
          {/* Filter Bar */}
          <div className="staff-filter-bar">
            <div className="staff-search-wrap">
              <svg className="staff-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="staff-search-input"
                placeholder="Search by name, ID, email, phone, or city..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button type="button" className="staff-clear-search"
                  onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search">×</button>
              )}
            </div>

            <select className="staff-filter-select" value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value || "all-roles"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select className="staff-filter-select" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all-status"} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Meta Row */}
          <div className="staff-table-meta">
            <span className="text-muted text-sm">
              {filteredStaff.length === 0
                ? "No members found"
                : `Showing ${rangeStart}–${rangeEnd} of ${filteredStaff.length} member${filteredStaff.length !== 1 ? "s" : ""}`}
            </span>
            <div className="staff-page-size">
              <label htmlFor="staff-page-size" className="text-muted text-sm">Rows per page</label>
              <select id="staff-page-size" className="staff-filter-select staff-page-size-select"
                value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="staff-table-scroll">
            <table className="data-table staff-data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="staff-empty-cell">
                      <div className="staff-empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="staff-empty-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="staff-empty-title">No staff members found</p>
                        <p className="text-muted text-sm">
                          {hasActiveFilters ? "Try adjusting your search or filters" : "Get started by adding your first team member"}
                        </p>
                        {hasActiveFilters ? (
                          <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>Clear Filters</button>
                        ) : (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>Add Member</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((member) => (
                    <tr key={member.id}>
                      <td><span className="staff-id-badge">{member.id}</span></td>
                      <td>
                        <div className="staff-member-cell">
                          <div className="staff-avatar">{getInitials(member.name)}</div>
                          <div>
                            <strong>{member.name}</strong>
                            {member.email && (
                              <span className="text-muted text-sm staff-email">{member.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className="staff-role-badge">{formatRole(member.role)}</span></td>
                      <td><span className="staff-contact">{member.mobile}</span></td>
                      <td><span className="text-muted">{member.city || "—"}</span></td>
                      <td>
                        <span className={`badge ${member.status === "Active" ? "badge-success" : "badge-error"}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="staff-actions" style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}
                            onClick={() => setEditingMember(member)}
                            title="Edit Member"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`btn btn-outline btn-xs ${member.status === "Active" ? "text-danger" : "text-success"}`}
                            style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => handleToggleStatus(member)}
                            disabled={togglingId === member.id}
                            title={member.status === "Active" ? "Deactivate Member" : "Activate Member"}
                          >
                            {togglingId === member.id ? "..." : <PowerIcon />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredStaff.length > 0 && (
            <div className="staff-pagination">
              <button type="button" className="btn btn-outline btn-sm"
                disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Previous
              </button>

              <div className="staff-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - safePage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="staff-page-ellipsis">…</span>
                    ) : (
                      <button key={item} type="button"
                        className={`staff-page-btn ${safePage === item ? "active" : ""}`}
                        onClick={() => setPage(item)}>
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button type="button" className="btn btn-outline btn-sm"
                disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
