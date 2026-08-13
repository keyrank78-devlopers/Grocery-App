import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import Modal from "../../Modal";
import AddProduct from "./AddProduct";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ProductsView() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteProd, setDeleteProd] = useState(null);

  // ── Fetch Products ─────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/get-products`, { withCredentials: true });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Add Success ────────────────────────────────────────────────
  const handleAddSuccess = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
    setIsAdding(false);
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggle = async (prod) => {
    if (togglingId) return;
    setTogglingId(prod.sku);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/products/${prod.sku}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setProducts((prev) =>
        prev.map((p) => p.sku === prod.sku ? { ...p, isActive } : p)
      );
      showToast(`Product ${isActive ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete Product ─────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteProd) return;
    setDeletingId(deleteProd.sku);
    try {
      await axios.delete(`${BASE_URL}/admin/delete-products/${deleteProd.sku}`, { withCredentials: true });
      setProducts((prev) => prev.filter((p) => p.sku !== deleteProd.sku));
      setDeleteProd(null);
      showToast("Product deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Add View ───────────────────────────────────────────────────
  if (isAdding) {
    return (
      <AddProduct
        onCancel={() => setIsAdding(false)}
        onSuccess={handleAddSuccess}
      />
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading products...</p>
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
          <h2>Product Management</h2>
          <p className="page-subtitle">Manage inventory, pricing, and product listings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          + Add Product
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP (₹)</th>
              <th>Sell Price (₹)</th>
              <th>Stock</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No products found. Add your first product!
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td><span className="staff-id-badge">{p.sku}</span></td>
                  <td>
                    {p.image?.url ? (
                      <img src={p.image.url} alt={p.name}
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                    ) : (
                      <div className="table-img-placeholder">📦</div>
                    )}
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <span className="text-muted text-sm" style={{ display: "block", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description}
                      </span>
                    )}
                  </td>
                  <td>
                    <div>
                      <span className="staff-role-badge">{p.category?.name || "—"}</span>
                      {p.subCategory?.name && (
                        <span className="text-muted text-sm" style={{ display: "block", marginTop: "3px" }}>
                          {p.subCategory.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>₹{parseFloat(p.mrp).toFixed(2)}</td>
                  <td>₹{parseFloat(p.sellPrice).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.stockQuantity > 0 ? "badge-success" : "badge-error"}`}>
                      {p.stockQuantity > 0 ? `${p.stockQuantity} units` : "Out of Stock"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-success" : "badge-error"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="staff-actions">
                      <button
                        className={`btn btn-outline btn-xs ${p.isActive ? "text-danger" : "text-success"}`}
                        onClick={() => handleToggle(p)}
                        disabled={togglingId === p.sku}
                      >
                        {togglingId === p.sku ? "..." : p.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn btn-outline btn-xs text-danger"
                        onClick={() => setDeleteProd(p)}
                        disabled={deletingId === p.sku}
                      >
                        {deletingId === p.sku ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Delete Confirm Modal ── */}
      <Modal isOpen={!!deleteProd} onClose={() => setDeleteProd(null)} title="Delete Product">
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗑️</div>
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            Are you sure you want to delete <strong>"{deleteProd?.name}"</strong>?
          </p>
          <p className="text-muted text-sm">This will also delete images from Cloudinary. Cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteProd(null)} disabled={!!deletingId}>
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
