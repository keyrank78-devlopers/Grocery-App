import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function CouponsView() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteCouponObj, setDeleteCouponObj] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCouponId, setEditCouponId] = useState("");

  const [addForm, setAddForm] = useState({
    code: "",
    discountType: "Percentage",
    discountValue: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    code: "",
    discountType: "Percentage",
    discountValue: "",
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch Coupons ───────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/coupons/admin`, {
        params: { page, limit: 10 },
        withCredentials: true,
      });
      setCoupons(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
      showToast("Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  // ── Search Filtering ────────────────────────────────────────────
  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter(
      (c) => c.code?.toLowerCase().includes(query)
    );
  }, [coupons, search]);

  // ── Toggle Status ───────────────────────────────────────────────
  const handleToggleStatus = async (coupon) => {
    if (togglingId) return;
    setTogglingId(coupon._id);
    try {
      const response = await axios.patch(
        `${BASE_URL}/coupons/admin/${coupon._id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const updated = response.data.data;
      setCoupons((prev) =>
        prev.map((c) => (c._id === updated._id ? { ...c, isActive: updated.isActive } : c))
      );
      showToast(
        `Coupon ${updated.isActive ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to update coupon status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Create Coupon ───────────────────────────────────────────────
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        code: addForm.code.trim().toUpperCase(),
        discountType: addForm.discountType,
        discountValue: Number(addForm.discountValue),
        isActive: addForm.isActive,
      };

      if (addForm.minPurchaseAmount) payload.minPurchaseAmount = Number(addForm.minPurchaseAmount);
      if (addForm.maxDiscountAmount) payload.maxDiscountAmount = Number(addForm.maxDiscountAmount);
      if (addForm.startDate) payload.startDate = new Date(addForm.startDate).toISOString();
      if (addForm.expiryDate) payload.expiryDate = new Date(addForm.expiryDate).toISOString();
      if (addForm.usageLimit) payload.usageLimit = Number(addForm.usageLimit);

      const response = await axios.post(`${BASE_URL}/coupons/admin`, payload, {
        withCredentials: true,
      });

      fetchCoupons();
      showToast("Coupon created successfully!", "success");
      setIsAddOpen(false);
      // Reset Form
      setAddForm({
        code: "",
        discountType: "Percentage",
        discountValue: "",
        minPurchaseAmount: "",
        maxDiscountAmount: "",
        startDate: "",
        expiryDate: "",
        usageLimit: "",
        isActive: true,
      });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to create coupon";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit Click & Form Populate ──────────────────────────────────
  const openEditModal = (coupon) => {
    setEditCouponId(coupon._id);
    
    // Format dates for input type="datetime-local" (YYYY-MM-DDThh:mm)
    const formatDate = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000; // in ms
      const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    setEditForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "Percentage",
      discountValue: coupon.discountValue || "",
      minPurchaseAmount: coupon.minPurchaseAmount || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      startDate: formatDate(coupon.startDate),
      expiryDate: formatDate(coupon.expiryDate),
      usageLimit: coupon.usageLimit || "",
      isActive: coupon.isActive !== false,
    });
    setIsEditOpen(true);
  };

  // ── Update Coupon ───────────────────────────────────────────────
  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        code: editForm.code.trim().toUpperCase(),
        discountType: editForm.discountType,
        discountValue: Number(editForm.discountValue),
        isActive: editForm.isActive,
      };

      payload.minPurchaseAmount = editForm.minPurchaseAmount ? Number(editForm.minPurchaseAmount) : 0;
      payload.maxDiscountAmount = editForm.maxDiscountAmount ? Number(editForm.maxDiscountAmount) : null;
      payload.startDate = editForm.startDate ? new Date(editForm.startDate).toISOString() : null;
      payload.expiryDate = editForm.expiryDate ? new Date(editForm.expiryDate).toISOString() : null;
      payload.usageLimit = editForm.usageLimit ? Number(editForm.usageLimit) : null;

      const response = await axios.put(`${BASE_URL}/coupons/admin/${editCouponId}`, payload, {
        withCredentials: true,
      });

      setCoupons((prev) =>
        prev.map((c) => (c._id === editCouponId ? response.data.data : c))
      );
      showToast("Coupon updated successfully!", "success");
      setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update coupon";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete Coupon ───────────────────────────────────────────────
  const handleDeleteCoupon = async () => {
    if (!deleteCouponObj || deletingId) return;
    setDeletingId(deleteCouponObj._id);
    try {
      await axios.delete(`${BASE_URL}/coupons/admin/${deleteCouponObj._id}`, {
        withCredentials: true,
      });
      fetchCoupons();
      showToast("Coupon deleted successfully!", "success");
      setDeleteCouponObj(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete coupon", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateLabel = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="content-section active">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Coupon Management</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          + Create Coupon
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <input
            type="text"
            className="staff-search-input"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: "36px" }}
          />
          <svg
            className="staff-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px" }}
          >
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Coupon List Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Purchase</th>
                  <th>Max Discount</th>
                  <th>Expiry Date</th>
                  <th>Usage Limit</th>
                  <th>Used</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                      No coupons found. Create your first coupon to offer discounts!
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td>
                        <span className="staff-id-badge" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {coupon.code}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {coupon.discountType === "Percentage"
                            ? `${coupon.discountValue}%`
                            : `₹${coupon.discountValue}`}
                        </strong>
                      </td>
                      <td>{coupon.minPurchaseAmount ? `₹${coupon.minPurchaseAmount}` : "₹0"}</td>
                      <td>
                        {coupon.discountType === "Percentage" && coupon.maxDiscountAmount
                          ? `₹${coupon.maxDiscountAmount}`
                          : "—"}
                      </td>
                      <td>
                        <span className="text-sm">{formatDateLabel(coupon.expiryDate)}</span>
                      </td>
                      <td>{coupon.usageLimit ? coupon.usageLimit : "Unlimited"}</td>
                      <td>
                        <span className="text-muted">{coupon.usedCount || 0}</span>
                      </td>
                      <td>
                        <span className={`badge ${coupon.isActive ? "badge-success" : "badge-error"}`}>
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="staff-actions" style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="btn btn-outline btn-xs"
                            style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}
                            onClick={() => openEditModal(coupon)}
                            title="Edit Coupon"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`btn btn-outline btn-xs ${coupon.isActive ? "text-danger" : "text-success"}`}
                            style={{ minWidth: "70px" }}
                            onClick={() => handleToggleStatus(coupon)}
                            disabled={togglingId === coupon._id}
                          >
                            {togglingId === coupon._id ? "..." : coupon.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            className="btn btn-outline btn-xs text-danger"
                            style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => setDeleteCouponObj(coupon)}
                            title="Delete Coupon"
                          >
                            <TrashIcon />
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
          </>
        )}
      </div>

      {/* ── Add Coupon Modal ── */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Coupon">
        <form onSubmit={handleCreateCoupon}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Coupon Code *</label>
            <input
              type="text"
              placeholder="e.g. SAVE20"
              value={addForm.code}
              onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
              required
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Discount Type *</label>
              <select
                value={addForm.discountType}
                onChange={(e) => setAddForm({ ...addForm, discountType: e.target.value })}
                required
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Discount Value *</label>
              <input
                type="number"
                min="1"
                placeholder={addForm.discountType === "Percentage" ? "e.g. 10" : "e.g. 100"}
                value={addForm.discountValue}
                onChange={(e) => setAddForm({ ...addForm, discountValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Min Purchase Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={addForm.minPurchaseAmount}
                onChange={(e) => setAddForm({ ...addForm, minPurchaseAmount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Max Discount Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 200 (optional)"
                disabled={addForm.discountType !== "Percentage"}
                value={addForm.maxDiscountAmount}
                onChange={(e) => setAddForm({ ...addForm, maxDiscountAmount: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Start Date</label>
              <input
                type="datetime-local"
                value={addForm.startDate}
                onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dee2e6", outline: "none", fontSize: "14px", height: "38px", boxSizing: "border-box" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Expiry Date *</label>
              <input
                type="datetime-local"
                value={addForm.expiryDate}
                onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dee2e6", outline: "none", fontSize: "14px", height: "38px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Usage Limit (Qty)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100 (optional)"
                value={addForm.usageLimit}
                onChange={(e) => setAddForm({ ...addForm, usageLimit: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="add-coupon-active"
                checked={addForm.isActive}
                onChange={(e) => setAddForm({ ...addForm, isActive: e.target.checked })}
              />
              <label htmlFor="add-coupon-active" style={{ cursor: "pointer", fontWeight: "600", margin: 0 }}>Active</label>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Coupon Modal ── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Coupon">
        <form onSubmit={handleUpdateCoupon}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Coupon Code *</label>
            <input
              type="text"
              placeholder="e.g. SAVE20"
              value={editForm.code}
              onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
              required
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Discount Type *</label>
              <select
                value={editForm.discountType}
                onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}
                required
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Discount Value *</label>
              <input
                type="number"
                min="1"
                placeholder="Discount value"
                value={editForm.discountValue}
                onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Min Purchase Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={editForm.minPurchaseAmount}
                onChange={(e) => setEditForm({ ...editForm, minPurchaseAmount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Max Discount Amount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 200 (optional)"
                disabled={editForm.discountType !== "Percentage"}
                value={editForm.maxDiscountAmount}
                onChange={(e) => setEditForm({ ...editForm, maxDiscountAmount: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Start Date</label>
              <input
                type="datetime-local"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dee2e6", outline: "none", fontSize: "14px", height: "38px", boxSizing: "border-box" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Expiry Date *</label>
              <input
                type="datetime-local"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #dee2e6", outline: "none", fontSize: "14px", height: "38px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group">
              <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>Usage Limit (Qty)</label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={editForm.usageLimit}
                onChange={(e) => setEditForm({ ...editForm, usageLimit: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="edit-coupon-active"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              <label htmlFor="edit-coupon-active" style={{ cursor: "pointer", fontWeight: "600", margin: 0 }}>Active</label>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteCouponObj} onClose={() => setDeleteCouponObj(null)} title="Delete Coupon">
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            Are you sure you want to delete coupon <strong>"{deleteCouponObj?.code}"</strong>?
          </p>
          <p className="text-muted text-sm">This action cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteCouponObj(null)} disabled={!!deletingId}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteCoupon}
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
