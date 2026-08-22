import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function BannersView() {
  const { showToast } = useToast();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Add Modal ──────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addImage, setAddImage] = useState(null);

  // ── Edit Modal ─────────────────────────────────────────────────
  const [editBanner, setEditBanner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editImage, setEditImage] = useState(null);

  // ── Delete Confirm Modal ───────────────────────────────────────
  const [deleteBanner, setDeleteBanner] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/banners`, {
        params: { page, limit: 10 },
        withCredentials: true 
      });
      setBanners(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load banners", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page]);

  // ── Add Banner ─────────────────────────────────────────────────
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!addImage) {
      showToast("Please select an image first", "error");
      return;
    }
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("image", addImage);

      const res = await axios.post(`${BASE_URL}/admin/banners`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchBanners();
      setAddImage(null);
      setIsAddOpen(false);
      showToast("Banner added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to add banner", "error");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit Banner ────────────────────────────────────────────────
  const openEditModal = (banner) => {
    setEditBanner(banner);
    setEditImage(null);
  };

  const handleEditBanner = async (e) => {
    e.preventDefault();
    if (!editImage) {
      // If no new image is selected, just close the modal
      setEditBanner(null);
      return;
    }
    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("image", editImage);

      const res = await axios.put(
        `${BASE_URL}/admin/update-banners/${editBanner.banner_id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setBanners((prev) =>
        prev.map((b) => (b.banner_id === editBanner.banner_id ? res.data.data : b))
      );
      setEditBanner(null);
      setEditImage(null);
      showToast("Banner image updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update banner", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // ── Delete Banner ──────────────────────────────────────────────
  const handleDeleteBanner = async () => {
    if (!deleteBanner) return;
    setDeletingId(deleteBanner.banner_id);
    try {
      await axios.delete(
        `${BASE_URL}/admin/delete-banners/${deleteBanner.banner_id}`,
        { withCredentials: true }
      );
      fetchBanners();
      setDeleteBanner(null);
      showToast("Banner deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete banner", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggleStatus = async (banner) => {
    if (togglingId) return;
    setTogglingId(banner.banner_id);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/banners/${banner.banner_id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setBanners((prev) =>
        prev.map((b) => (b.banner_id === banner.banner_id ? { ...b, isActive } : b))
      );
      showToast(`Banner ${isActive ? "activated" : "deactivated"} successfully`, "success");
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
            <p style={{ fontSize: "14px" }}>Loading banners...</p>
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
          <h2>Banner Management</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          + Add Banner
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Banner Image Preview</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No banners found. Add your first banner image!
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner._id}>
                  <td><span className="staff-id-badge">{banner.banner_id}</span></td>
                  <td>
                    {banner.image?.url ? (
                      <img
                        src={banner.image.url}
                        alt="Banner Preview"
                        style={{ width: "180px", height: "70px", borderRadius: "6px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="table-img-placeholder" style={{ width: "180px", height: "70px" }}>🖼️ No Image</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${banner.isActive ? "badge-success" : "badge-error"}`}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="staff-actions">
                      <button className="btn btn-outline btn-xs" onClick={() => openEditModal(banner)}>
                        Edit Image
                      </button>
                      <button
                        className={`btn btn-outline btn-xs ${banner.isActive ? "text-danger" : "text-success"}`}
                        onClick={() => handleToggleStatus(banner)}
                        disabled={togglingId === banner.banner_id}
                      >
                        {togglingId === banner.banner_id ? "..." : banner.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn btn-outline btn-xs text-danger"
                        onClick={() => setDeleteBanner(banner)}
                        disabled={deletingId === banner.banner_id}
                      >
                        {deletingId === banner.banner_id ? "..." : "Delete"}
                      </button>
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
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setAddImage(null);
        }}
        title="Add New Banner"
      >
        <form onSubmit={handleAddBanner}>
          <div className="form-group">
            <label>Banner Image <span className="text-danger">*</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAddImage(e.target.files[0] || null)}
              required
            />
            <p className="text-muted text-sm" style={{ marginTop: "4px" }}>
              Upload wide aspect ratio banners for best website display.
            </p>
          </div>
          {addImage && (
            <div className="form-group">
              <label>Selected Image Preview</label>
              <img
                src={URL.createObjectURL(addImage)}
                alt="Selected Preview"
                style={{ width: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "cover", marginTop: "6px" }}
              />
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? "Uploading..." : "Save Banner"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editBanner}
        onClose={() => {
          setEditBanner(null);
          setEditImage(null);
        }}
        title="Edit Banner Image"
      >
        <form onSubmit={handleEditBanner}>
          {editBanner?.image?.url && !editImage && (
            <div className="form-group">
              <label>Current Banner Image</label>
              <img
                src={editBanner.image.url}
                alt="current"
                style={{ width: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "cover", display: "block", marginTop: "6px" }}
              />
            </div>
          )}
          <div className="form-group">
            <label>New Banner Image <span className="text-danger">*</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditImage(e.target.files[0] || null)}
              required
            />
          </div>
          {editImage && (
            <div className="form-group">
              <label>New Image Preview</label>
              <img
                src={URL.createObjectURL(editImage)}
                alt="New Preview"
                style={{ width: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "cover", marginTop: "6px" }}
              />
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditBanner(null);
                setEditImage(null);
              }}
              disabled={isEditing}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isEditing}>
              {isEditing ? "Uploading..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteBanner} onClose={() => setDeleteBanner(null)} title="Delete Banner">
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            Are you sure you want to delete banner <strong>"{deleteBanner?.banner_id}"</strong>?
          </p>
          {deleteBanner?.image?.url && (
            <img
              src={deleteBanner.image.url}
              alt="To Delete"
              style={{ width: "150px", height: "60px", objectFit: "cover", borderRadius: "4px", margin: "10px auto" }}
            />
          )}
          <p className="text-muted text-sm">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteBanner(null)} disabled={!!deletingId}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteBanner}
            disabled={!!deletingId}
            style={{ background: "#dc3545", borderColor: "#dc3545", color: "#fff", padding: "8px 20px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontWeight: 500 }}
          >
            {deletingId ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
