import React, { useEffect, useState } from "react";
import axios from "axios";
import OrderDetailView from "./OrderDetailView";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ORDER_STATUSES = [
  "Pending",
  "Placed",
  "Accepted",
  "Processing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Return Approved",
  "Returned",
  "QC Failed",
  "Refunded",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];
const PAYMENT_METHODS = ["COD", "Online", "Wallet"];

export default function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ── Search & Filter State ───────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");

  // ── Pagination State ───────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search string (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch orders with params
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
        paymentMethod: paymentMethodFilter,
      };

      const res = await axios.get(`${BASE_URL}/admin/orders`, {
        params,
        withCredentials: true,
      });

      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, orderStatusFilter, paymentStatusFilter, paymentMethodFilter, page]);

  // Detail View Page Toggle
  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        onUpdateSuccess={(updatedOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o.order_id === updatedOrder.order_id ? updatedOrder : o))
          );
          setSelectedOrder(null);
        }}
      />
    );
  }

  // Loading Screen (Only on initial load)
  if (loading && orders.length === 0) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading orders...</p>
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
          <h2>Order History</h2>

        </div>
      </div>

      {/* ── Premium Filter Controls ── */}
      <div className="card" style={{ padding: "18px 24px", marginBottom: "20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", border: "1px solid #eef2f6" }}>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search Order ID, shipping name, mobile..."
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

        {/* Order Status Select */}
        <div style={{ minWidth: "160px" }}>
          <select
            value={orderStatusFilter}
            onChange={(e) => { setOrderStatusFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <option value="">All Order Status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Payment Status Select */}
        <div style={{ minWidth: "150px" }}>
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <option value="">All Payment Status</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Select */}
        <div style={{ minWidth: "150px" }}>
          <select
            value={paymentMethodFilter}
            onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || orderStatusFilter || paymentStatusFilter || paymentMethodFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm("");
              setOrderStatusFilter("");
              setPaymentStatusFilter("");
              setPaymentMethodFilter("");
              setPage(1);
            }}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Orders Grid Table ── */}
      <div className="card" style={{ position: "relative" }}>
        {/* Loading overlay when paging or filtering in background */}
        {loading && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255, 255, 255, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "65px" }}>S.No.</th>
              <th>Order ID</th>
              <th>Date / Time</th>
              <th>Customer</th>
              <th>Items Summary</th>
              <th>Total Price (₹)</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => {
                let statusClass = "badge-success";
                const status = order.orderStatus || "Pending";
                if (status === "Cancelled" || status === "QC Failed") statusClass = "badge-error";
                if (status === "Delivered" || status === "Refunded") statusClass = "badge-muted";

                let methodClass = "badge-cod";
                const method = order.paymentInfo?.method || "COD";
                if (method.toLowerCase().includes("wallet")) methodClass = "badge-wallet";
                if (method.toLowerCase().includes("online")) methodClass = "badge-online";

                return (
                  <tr key={order.order_id}>
                    <td style={{ fontWeight: "600", color: "#64748b" }}>{(page - 1) * 10 + idx + 1}</td>
                    <td><span className="staff-id-badge">{order.order_id}</span></td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{order.shippingAddress?.name || "—"}</strong> <br />
                      <small className="text-muted">{order.shippingAddress?.mobile || ""}</small>
                    </td>
                    <td>
                      <span className="text-muted text-sm" style={{ display: "block", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}>
                        {order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                      </span>
                    </td>
                    <td>₹{parseFloat(order.pricing?.totalPrice || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge-method ${methodClass}`}>{method}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>{status}</span>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-outline btn-xs"
                        style={{ padding: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        {/* Eye Icon */}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Server-side Pagination Navigation ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "12px 24px", background: "#fff", borderRadius: "12px", border: "1px solid #eef2f6", boxShadow: "0 2px 12px rgba(0,0,0,0.01)" }}>
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              style={{ padding: "7px 14px", fontSize: "13px", cursor: page === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              style={{ padding: "7px 14px", fontSize: "13px", cursor: page === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
