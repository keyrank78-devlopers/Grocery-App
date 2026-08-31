import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CategoriesView() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!user?.permissions?.categories?.canEdit;
  const canDelete = isAdmin || !!user?.permissions?.categories?.canDelete;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters State ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Add Modal ──────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addImage, setAddImage] = useState(null);

  // ── Edit Modal ─────────────────────────────────────────────────
  const [editCat, setEditCat] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState(null);

  // ── Delete Confirm Modal ───────────────────────────────────────
  const [deleteCat, setDeleteCat] = useState(null);

  // Debounce search string (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/categories`, {
        params: { page, limit: 10, search: debouncedSearch, status: statusFilter },
        withCredentials: true 
      });
      console.log("response of catgeories api",res);
      setCategories(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, statusFilter]);

  // ── Add Category ───────────────────────────────────────────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", newCatName.trim());
      if (addImage) formData.append("image", addImage);

      const res = await axios.post(`${BASE_URL}/categories`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchCategories();
      setNewCatName("");
      setAddImage(null);
      setIsAddOpen(false);
      showToast("Category added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to add category", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit Category ──────────────────────────────────────────────
  const openEditModal = (cat) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditImage(null);
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      if (editImage) formData.append("image", editImage);

      const res = await axios.put(
        `${BASE_URL}/categories/${editCat.category_id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setCategories((prev) =>
        prev.map((c) => c.category_id === editCat.category_id ? res.data.data : c)
      );
      setEditCat(null);
      setEditName("");
      setEditImage(null);
      showToast("Category updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update category", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // ── Delete Category ────────────────────────────────────────────
  const handleDeleteCategory = async () => {
    if (!deleteCat) return;
    setDeletingId(deleteCat.category_id);
    try {
      await axios.delete(
        `${BASE_URL}/categories/${deleteCat.category_id}`,
        { withCredentials: true }
      );
      fetchCategories();
      setDeleteCat(null);
      showToast("Category deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete category", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggleStatus = async (cat) => {
    if (togglingId) return;
    setTogglingId(cat.category_id);
    try {
      const res = await axios.patch(
        `${BASE_URL}/categories/${cat.category_id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setCategories((prev) =>
        prev.map((c) => c.category_id === cat.category_id ? { ...c, isActive } : c)
      );
      showToast(`Category ${isActive ? "activated" : "deactivated"} successfully`, "success");
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
            <p style={{ fontSize: "14px" }}>Loading categories...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Category Management</h2>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            + Add Category
          </button>
        )}
      </div>

      {/* ── Filter Toolbar ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: "1", minWidth: "200px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px" }}
          />
          <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
        {(searchTerm || statusFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
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
              <th>Category Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No categories found. Add your first category!
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id}>
                  <td><span className="staff-id-badge">{cat.category_id}</span></td>
                  <td>
                    {cat.image?.url ? (
                      <img src={cat.image.url} alt={cat.name}
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                    ) : (
                      <div className="table-img-placeholder">📁</div>
                    )}
                  </td>
                  <td><strong>{cat.name}</strong></td>
                  <td><span className="text-muted">{cat.slug}</span></td>
                  <td>
                    <span className={`badge ${cat.isActive ? "badge-success" : "badge-error"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="staff-actions">
                      {canEdit && (
                        <>
                          <button className="btn btn-outline btn-xs" onClick={() => openEditModal(cat)}>
                            Edit
                          </button>
                          <button
                            className={`btn btn-outline btn-xs ${cat.isActive ? "text-danger" : "text-success"}`}
                            onClick={() => handleToggleStatus(cat)}
                            disabled={togglingId === cat.category_id}
                          >
                            {togglingId === cat.category_id ? "..." : cat.isActive ? "Disable" : "Enable"}
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          onClick={() => setDeleteCat(cat)}
                          disabled={deletingId === cat.category_id}
                        >
                          {deletingId === cat.category_id ? "..." : "Delete"}
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
      <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setNewCatName(""); setAddImage(null); }} title="Add New Category">
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label>Category Name <span className="text-danger">*</span></label>
            <input type="text" placeholder="e.g. Vegetables & Fruits" value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Slug (Auto-generated)</label>
            <input type="text" value={newCatName.toLowerCase().replace(/[^a-z0-9]+/g, "-")} disabled />
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" accept="image/*" onChange={(e) => setAddImage(e.target.files[0] || null)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={isAdding}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editCat} onClose={() => { setEditCat(null); setEditName(""); setEditImage(null); }} title="Edit Category">
        <form onSubmit={handleEditCategory}>
          <div className="form-group">
            <label>Category Name <span className="text-danger">*</span></label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Slug (Auto-generated)</label>
            <input type="text" value={editName.toLowerCase().replace(/[^a-z0-9]+/g, "-")} disabled />
          </div>
          {editCat?.image?.url && (
            <div className="form-group">
              <label>Current Image</label>
              <img src={editCat.image.url} alt="current"
                style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", display: "block", marginTop: "6px" }} />
            </div>
          )}
          <div className="form-group">
            <label>New Image (optional — replaces current)</label>
            <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0] || null)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary"
              onClick={() => { setEditCat(null); setEditName(""); setEditImage(null); }} disabled={isEditing}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category">
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            Are you sure you want to delete <strong>"{deleteCat?.name}"</strong>?
          </p>
          <p className="text-muted text-sm">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteCat(null)} disabled={!!deletingId}>
            Cancel
          </button>
          <button type="button" onClick={handleDeleteCategory} disabled={!!deletingId}
            style={{ background: "#dc3545", borderColor: "#dc3545", color: "#fff", padding: "8px 20px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontWeight: 500 }}>
            {deletingId ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
