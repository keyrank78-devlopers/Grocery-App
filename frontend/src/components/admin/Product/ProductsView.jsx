import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import Modal from "../../Modal";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import ProductDetailView from "./ProductDetailView";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── SVG Icons for premium action buttons ─────────────────────────
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

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

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function ProductsView() {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!user?.permissions?.products?.canEdit;
  const canDelete = isAdmin || !!user?.permissions?.products?.canDelete;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteProd, setDeleteProd] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  // ── Search & Filter State ───────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Pagination State ───────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Dropdowns State ─────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);

  // Fetch Category and Subcategory dropdown data once
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          axios.get(`${BASE_URL}/categories`, { withCredentials: true }),
          axios.get(`${BASE_URL}/sub-categories`, { withCredentials: true }),
        ]);
        setCategories(catRes.data.data?.filter(c => c.isActive) || []);
        setSubCategories(subRes.data.data?.filter(s => s.isActive) || []);
      } catch (err) {
        console.error("Filter Fetch Error:", err);
      }
    };
    fetchFilters();
  }, []);

  // Sync subcategory selection when category filter updates
  useEffect(() => {
    setSubCategoryFilter("");
    if (!categoryFilter) {
      setFilteredSubs([]);
      return;
    }
    const filtered = subCategories.filter(
      (s) => s.category?._id === categoryFilter || s.category === categoryFilter
    );
    setFilteredSubs(filtered);
  }, [categoryFilter, subCategories]);

  // Debounce search string (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page to 1 when search changes
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ── Fetch Products from Server ───────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        category: categoryFilter,
        subCategory: subCategoryFilter,
        status: statusFilter,
      };

      const res = await axios.get(`${BASE_URL}/products`, {
        params,
        withCredentials: true,
      });

      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, categoryFilter, subCategoryFilter, statusFilter, page]);

  // ── Add Success ────────────────────────────────────────────────
  const handleAddSuccess = () => {
    fetchProducts();
    setIsAdding(false);
  };

  // ── Toggle Status ──────────────────────────────────────────────
  const handleToggle = async (prod) => {
    if (togglingId) return;
    setTogglingId(prod.sku);
    try {
      const res = await axios.patch(
        `${BASE_URL}/products/${prod.sku}/toggle-status`,
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
      await axios.delete(`${BASE_URL}/products/${deleteProd.sku}`, { withCredentials: true });
      setDeleteProd(null);
      showToast("Product deleted successfully!", "success");
      fetchProducts(); // Reload grid
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

  // ── Edit View ──────────────────────────────────────────────────
  if (editingProduct) {
    return (
      <EditProduct
        product={editingProduct}
        onCancel={() => setEditingProduct(null)}
        onSuccess={() => {
          fetchProducts();
          setEditingProduct(null);
        }}
      />
    );
  }

  // ── Detail View ────────────────────────────────────────────────
  if (viewingProduct) {
    return (
      <ProductDetailView
        product={viewingProduct}
        onCancel={() => setViewingProduct(null)}
        onEdit={(prod) => {
          setViewingProduct(null);
          setEditingProduct(prod);
        }}
      />
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading && products.length === 0) {
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

        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            + Add Product
          </button>
        )}
      </div>

      {/* ── Premium Filter Controls ── */}
      <div className="card" style={{ padding: "18px 24px", marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", border: "1px solid #eef2f6" }}>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by SKU, name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
            >
              ×
            </button>
          )}
        </div>

        {/* Category Select */}
        <div style={{ minWidth: "160px" }}>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sub-Category Select */}
        <div style={{ minWidth: "180px" }}>
          <select
            value={subCategoryFilter}
            onChange={(e) => { setSubCategoryFilter(e.target.value); setPage(1); }}
            disabled={!categoryFilter}
            style={{ width: "100%", cursor: !categoryFilter ? "not-allowed" : "pointer" }}
          >
            <option value="">
              {!categoryFilter ? "Select Category First" : "All Sub-categories"}
            </option>
            {filteredSubs.map((sub) => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div style={{ minWidth: "130px" }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || categoryFilter || subCategoryFilter || statusFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("");
              setSubCategoryFilter("");
              setStatusFilter("");
              setPage(1);
            }}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Table Grid ── */}
      <div className="card" style={{ position: "relative" }}>
        {/* Loading overlay when refreshing pages in background */}
        {loading && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255, 255, 255, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "65px" }}>S.No.</th>
              <th>SKU</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP (₹)</th>
              <th>Sell Price (₹)</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No products found. Match another search query or add a product!
                </td>
              </tr>
            ) : (
              products.map((p, idx) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: "600", color: "#64748b" }}>{(page - 1) * 10 + idx + 1}</td>
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
                        {p.description.replace(/[#*`_]/g, "")}
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
                  <td>₹{parseFloat(p.mrp || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(p.sellPrice || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-success" : "badge-error"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="staff-actions" style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className="btn btn-outline btn-xs"
                        style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}
                        onClick={() => setViewingProduct(p)}
                        disabled={togglingId === p.sku || deletingId === p.sku}
                        title="View Details"
                      >
                        <EyeIcon />
                      </button>
                      {canEdit && (
                        <button
                          className="btn btn-outline btn-xs"
                          style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}
                          onClick={() => setEditingProduct(p)}
                          disabled={togglingId === p.sku || deletingId === p.sku}
                          title="Edit Details"
                        >
                          <EditIcon />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          className={`btn btn-outline btn-xs ${p.isActive ? "text-danger" : "text-success"}`}
                          style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => handleToggle(p)}
                          disabled={togglingId === p.sku}
                          title={p.isActive ? "Deactivate Product" : "Activate Product"}
                        >
                          {togglingId === p.sku ? "..." : <PowerIcon />}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => setDeleteProd(p)}
                          disabled={deletingId === p.sku}
                          title="Delete Product"
                        >
                          {deletingId === p.sku ? "..." : <TrashIcon />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Server-side Pagination Navigation ── */}
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
