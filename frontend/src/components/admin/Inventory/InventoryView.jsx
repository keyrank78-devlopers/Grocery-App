import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Modal from "../../Modal";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function InventoryView() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  // Manage Stock Modal State
  const [manageProduct, setManageProduct] = useState(null);
  const [stockInputs, setStockInputs] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/admin/get-warehouses`, { withCredentials: true });
        let allWarehouses = res.data.data?.filter(w => w.isActive) || [];

        // Restrict for Managers/Agents
        if (user && ["warehouse_manager", "agent"].includes(user.role)) {
          const assignedIds = user.assignedWarehouses?.map(w => typeof w === 'object' ? w.id || w._id : w) || [];
          allWarehouses = allWarehouses.filter(w => assignedIds.includes(w._id) || assignedIds.includes(w.warehouse_id));
          
          if (allWarehouses.length === 1) {
            setWarehouseFilter(allWarehouses[0]._id);
          }
        }
        
        setWarehouses(allWarehouses);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWarehouses();
  }, [user]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/inventory`, {
        params: { page, limit: 15, search: debouncedSearch, warehouseId: warehouseFilter },
        withCredentials: true
      });
      setInventory(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, debouncedSearch, warehouseFilter]);

  // Handle Stock Manage Modal
  const openManageModal = (product) => {
    setManageProduct(product);
    const initialInputs = {};
    warehouses.forEach(w => {
      // Find if product has stock for this warehouse
      const stockEntry = product.stocks?.find(s => s.warehouse?.warehouse_id === w.warehouse_id || s.warehouse?._id === w._id);
      initialInputs[w._id] = stockEntry ? stockEntry.quantity : 0;
    });
    setStockInputs(initialInputs);
  };

  const handleStockChange = (warehouseId, value) => {
    setStockInputs(prev => ({
      ...prev,
      [warehouseId]: value
    }));
  };

  const saveStockUpdates = async () => {
    setIsUpdating(true);
    try {
      // Create promises for all warehouse updates
      const updatePromises = warehouses.map(w => {
        return axios.put(
          `${BASE_URL}/admin/inventory/update`,
          {
            productId: manageProduct._id,
            warehouseId: w._id,
            quantity: Number(stockInputs[w._id]) || 0
          },
          { withCredentials: true }
        );
      });

      await Promise.all(updatePromises);
      showToast("Stock updated successfully across warehouses!", "success");
      setManageProduct(null);
      fetchInventory(); // Refresh to see new stock
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update stock", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to calculate total stock for a product
  const getTotalStock = (stocks) => {
    if (!stocks || !stocks.length) return 0;
    return stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading inventory...</p>
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
          <h2>Inventory Management</h2>
          <p className="text-muted" style={{ marginTop: "4px" }}>Manage stock levels across all your warehouses</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: "1", minWidth: "200px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px" }}
          />
          <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Warehouse Filter */}
        {(!user || !["warehouse_manager", "agent"].includes(user.role) || warehouses.length > 1) && (
          <div style={{ minWidth: "200px" }}>
            <select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
              style={{ width: "100%", cursor: "pointer", height: "42px", padding: "10px 14px" }}
            >
              {(!user || !["warehouse_manager", "agent"].includes(user.role)) && (
                <option value="">All Warehouses</option>
              )}
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>{w.name} ({w.warehouse_id})</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters */}
        {(searchTerm || warehouseFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setWarehouseFilter("");
              setPage(1);
            }}
            style={{ height: "42px", padding: "0 18px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px", fontWeight: "600", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>{warehouseFilter ? "Stock (Filtered)" : "Total Stock (All)"}</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No products found in inventory.
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const totalStock = getTotalStock(item.stocks);
                return (
                  <tr key={item._id}>
                    <td><span className="staff-id-badge">{item.sku}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {item.image?.url ? (
                          <img src={item.image.url} alt={item.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                        ) : (
                          <div className="table-img-placeholder">📦</div>
                        )}
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ display: "block", fontSize: "13px" }}>{item.category?.name || "N/A"}</span>
                        {item.subCategory?.name && <span className="text-muted text-sm">{item.subCategory.name}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${totalStock > 0 ? "badge-success" : "badge-error"}`}>
                        {totalStock > 0 ? `${totalStock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.isActive ? "badge-success" : "badge-error"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn btn-primary btn-xs" 
                        onClick={() => openManageModal(item)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Manage Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
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

      {/* Manage Stock Modal */}
      {manageProduct && (
        <Modal isOpen={!!manageProduct} onClose={() => setManageProduct(null)} title={`Manage Stock: ${manageProduct.name}`}>
          <div style={{ marginBottom: "16px" }}>
            <p className="text-muted text-sm">Enter the available stock quantity for each warehouse.</p>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
            {warehouses.length === 0 ? (
              <p style={{ textAlign: "center", color: "#dc3545", padding: "20px 0" }}>No active warehouses found. Please create a warehouse first.</p>
            ) : (
              warehouses.map(w => (
                <div key={w._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>{w.name}</strong>
                    <span className="text-muted text-sm">{w.warehouse_id} | {w.address?.city}</span>
                  </div>
                  <div style={{ width: "120px" }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={stockInputs[w._id]} 
                      onChange={(e) => handleStockChange(w._id, e.target.value)}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ced4da", borderRadius: "6px", textAlign: "right" }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setManageProduct(null)} disabled={isUpdating}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveStockUpdates} disabled={isUpdating || warehouses.length === 0}>
              {isUpdating ? "Saving..." : "Save Stock"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
