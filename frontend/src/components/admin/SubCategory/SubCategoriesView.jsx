import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SubCategoriesView() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!user?.permissions?.subcategories?.canEdit;
  const canDelete = isAdmin || !!user?.permissions?.subcategories?.canDelete;

  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]); // parent categories for dropdown
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters State ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [parentCatFilter, setParentCatFilter] = useState("");

  // ── Add Modal ──────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category_id: "" });
  const [addImage, setAddImage] = useState(null);

  // ── Edit Modal ─────────────────────────────────────────────────
  const [editSub, setEditSub] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", category_id: "" });
  const [editImage, setEditImage] = useState(null);

  // ── Delete Confirm Modal ───────────────────────────────────────
  const [deleteSub, setDeleteSub] = useState(null);

  // Debounce search string (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ── Fetch SubCategories ────────────────────────────────────────
  const fetchSubCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/sub-categories`, {
        params: { 
          page, 
          limit: 10,
          search: debouncedSearch,
          status: statusFilter,
          category_id: parentCatFilter
        },
        withCredentials: true 
      });
      setSubCategories(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load sub-categories", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Parent Categories for dropdown ───────────────────────
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/categories`, { withCredentials: true });
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories();
  }, [page, debouncedSearch, statusFilter, parentCatFilter]);

  // ── Add SubCategory ────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.category_id) return;
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", addForm.name.trim());
      formData.append("category_id", addForm.category_id);
      if (addImage) formData.append("image", addImage);

      const res = await axios.post(`${BASE_URL}/sub-categories`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchSubCategories();
      setAddForm({ name: "", category_id: "" });
      setAddImage(null);
      setIsAddOpen(false);
      showToast("Sub-category added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to add sub-category", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit SubCategory ───────────────────────────────────────────
  const openEditModal = (sub) => {
    setEditSub(sub);
    setEditForm({
      name: sub.name,
      category_id: sub.category?.category_id || "",
    });
    setEditImage(null);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      if (editForm.category_id) formData.append("category_id", editForm.category_id);
      if (editImage) formData.append("image", editImage);

      const res = await axios.put(
        `${BASE_URL}/sub-categories/${editSub.sub_category_id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSubCategories((prev) =>
        prev.map((s) => s.sub_category_id === editSub.sub_category_id ? res.data.data : s)
      );
      setEditSub(null);
      showToast("Sub-category updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update sub-category", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // ── Delete SubCategory ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteSub) return;
    setDeletingId(deleteSub.sub_category_id);
    try {
      await axios.delete(
        `${BASE_URL}/sub-categories/${deleteSub.sub_category_id}`,
        { withCredentials: true }
      );
      fetchSubCategories();
      setDeleteSub(null);
      showToast("Sub-category deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete sub-category", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggle = async (sub) => {
    if (togglingId) return;
    setTogglingId(sub.sub_category_id);
    try {
      const res = await axios.patch(
        `${BASE_URL}/sub-categories/${sub.sub_category_id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setSubCategories((prev) =>
        prev.map((s) => s.sub_category_id === sub.sub_category_id ? { ...s, isActive } : s)
      );
      showToast(`Sub-category ${isActive ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading sub-categories...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Sub-Category Management</h2>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            + Add Sub-Category
          </button>
        )}
      </div>

      {/* ── Filter Toolbar ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: "1", minWidth: "200px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search sub-categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px" }}
          />
          <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Parent Category Filter */}
        <div style={{ minWidth: "180px" }}>
          <select
            value={parentCatFilter}
            onChange={(e) => { setParentCatFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer", height: "42px", padding: "10px 14px" }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: "140px" }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer", height: "42px", padding: "10px 14px" }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter || parentCatFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setParentCatFilter("");
              setPage(1);
            }}
            style={{ height: "42px", padding: "0 18px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px", fontWeight: "600", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thumbnail</th>
              <th>Sub-Category Name</th>
              <th>Parent Category</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subCategories.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No sub-categories found. Add your first sub-category!
                </td>
              </tr>
            ) : (
              subCategories.map((sub) => (
                <tr key={sub._id}>
                  <td><span className="staff-id-badge">{sub.sub_category_id}</span></td>
                  <td>
                    {sub.image?.url ? (
                      <img src={sub.image.url} alt={sub.name}
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                    ) : (
                      <div className="table-img-placeholder">📂</div>
                    )}
                  </td>
                  <td><strong>{sub.name}</strong></td>
                  <td>
                    <span className="staff-role-badge">{sub.category?.name || "—"}</span>
                  </td>
                  <td><span className="text-muted">{sub.slug}</span></td>
                  <td>
                    <span className={`badge ${sub.isActive ? "badge-success" : "badge-error"}`}>
                      {sub.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="staff-actions">
                      {canEdit && (
                        <>
                          <button className="btn btn-outline btn-xs" onClick={() => openEditModal(sub)}>
                            Edit
                          </button>
                          <button
                            className={`btn btn-outline btn-xs ${sub.isActive ? "text-danger" : "text-success"}`}
                            onClick={() => handleToggle(sub)}
                            disabled={togglingId === sub.sub_category_id}
                          >
                            {togglingId === sub.sub_category_id ? "..." : sub.isActive ? "Disable" : "Enable"}
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          onClick={() => setDeleteSub(sub)}
                          disabled={deletingId === sub.sub_category_id}
                        >
                          {deletingId === sub.sub_category_id ? "..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Table Pagination ── */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="pagination-actions">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setAddForm({ name: "", category_id: "" }); setAddImage(null); }} title="Add New Sub-Category">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Sub-Category Name <span className="text-danger">*</span></label>
            <input type="text" placeholder="e.g. Leafy Vegetables"
              value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Parent Category <span className="text-danger">*</span></label>
            <select value={addForm.category_id} onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })} required>
              <option value="">Select Category</option>
              {categories.filter(c => c.isActive).map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Slug (Auto-generated)</label>
            <input type="text" value={addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} disabled />
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" accept="image/*" onChange={(e) => setAddImage(e.target.files[0] || null)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={isAdding}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? "Saving..." : "Save Sub-Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editSub} onClose={() => { setEditSub(null); setEditImage(null); }} title="Edit Sub-Category">
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label>Sub-Category Name <span className="text-danger">*</span></label>
            <input type="text" value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Parent Category</label>
            <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}>
              <option value="">Keep Current</option>
              {categories.filter(c => c.isActive).map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Slug (Auto-generated)</label>
            <input type="text" value={editForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} disabled />
          </div>
          {editSub?.image?.url && (
            <div className="form-group">
              <label>Current Image</label>
              <img src={editSub.image.url} alt="current"
                style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", display: "block", marginTop: "6px" }} />
            </div>
          )}
          <div className="form-group">
            <label>New Image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0] || null)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditSub(null)} disabled={isEditing}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteSub} onClose={() => setDeleteSub(null)} title="Delete Sub-Category">
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            Are you sure you want to delete <strong>"{deleteSub?.name}"</strong>?
          </p>
          <p className="text-muted text-sm">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteSub(null)} disabled={!!deletingId}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={!!deletingId}
            style={{ background: "#dc3545", borderColor: "#dc3545", color: "#fff", padding: "8px 20px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontWeight: 500 }}>
            {deletingId ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
