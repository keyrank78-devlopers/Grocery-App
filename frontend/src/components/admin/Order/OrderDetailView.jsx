import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_TIMELINE = [
  "Pending",
  "Placed",
  "Accepted",
  "Processing",
  "Out for Delivery",
  "Delivered",
];

export default function OrderDetailView({ order, onCancel, onUpdateSuccess }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!user?.permissions?.orders?.canEdit;

  const [orderStatus, setOrderStatus] = useState(order.orderStatus || "Pending");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentInfo?.status || "Pending");
  const [isUpdating, setIsUpdating] = useState(false);

  // Status index for timeline progress bar
  const currentStatusIndex = STATUS_TIMELINE.indexOf(orderStatus);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/admin/orders/${order.order_id}/status`,
        { orderStatus, paymentStatus },
        { withCredentials: true }
      );
      showToast("Order status updated successfully!", "success");
      onUpdateSuccess(res.data.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="content-section active order-detail-page">
      <style>{`
        .order-detail-page {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eef2f6;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .order-grid {
          display: grid;
          grid-template-columns: 7.5fr 4.5fr;
          gap: 28px;
        }
        @media (max-width: 992px) {
          .order-grid {
            grid-template-columns: 1fr;
          }
        }
        .order-card {
          background: #fff;
          border: 1px solid #eef2f6;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
          margin-bottom: 24px;
        }
        .order-card h3 {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 18px;
          border-bottom: 1px solid #f8fafc;
          padding-bottom: 10px;
          letter-spacing: 0.02em;
        }

        /* Timeline styles */
        .timeline-container {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin: 20px 0 32px;
          padding: 0 10px;
        }
        .timeline-line {
          position: absolute;
          top: 15px;
          left: 5%;
          right: 5%;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }
        .timeline-line-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #22c55e;
          transition: width 0.4s ease;
        }
        .timeline-step {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
        }
        .timeline-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          color: #64748b;
          transition: all 0.3s ease;
        }
        .timeline-step.completed .timeline-dot {
          background: #22c55e;
          border-color: #22c55e;
          color: #fff;
        }
        .timeline-step.active .timeline-dot {
          border-color: #22c55e;
          color: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
        }
        .timeline-label {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-align: center;
          white-space: nowrap;
        }
        .timeline-step.active .timeline-label,
        .timeline-step.completed .timeline-label {
          color: #1e293b;
          font-weight: 700;
        }

        /* Items list styles */
        .order-items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-items-table th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          padding: 10px 16px;
          border-bottom: 1px solid #eef2f6;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .order-items-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f8fafc;
          font-size: 14px;
          vertical-align: middle;
        }
        .item-preview {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .item-img {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .item-info-name {
          font-weight: 600;
          color: #334155;
        }
        .item-info-sku {
          font-size: 11px;
          color: #94a3b8;
          font-family: monospace;
          margin-top: 2px;
        }

        /* Address styles */
        .addr-info p {
          margin: 0 0 6px;
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
        }

        /* Summary pricing row */
        .pricing-summary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pricing-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #64748b;
        }
        .pricing-row.total {
          border-top: 1px solid #eef2f6;
          padding-top: 12px;
          margin-top: 4px;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        /* Operation Panel */
        .operation-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="order-header">
        <div>
          <h2>Order Details</h2>
          <p className="page-subtitle">Detailed invoice and logistics data for {order.order_id}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          ← Back to Orders
        </button>
      </div>

      {/* Timeline Status */}
      {STATUS_TIMELINE.includes(orderStatus) && (
        <div className="order-card" style={{ padding: "28px 24px 20px" }}>
          <div className="timeline-container">
            <div className="timeline-line">
              <div
                className="timeline-line-progress"
                style={{ width: `${(currentStatusIndex / (STATUS_TIMELINE.length - 1)) * 100}%` }}
              />
            </div>
            {STATUS_TIMELINE.map((step, idx) => {
              const isCompleted = idx < currentStatusIndex;
              const isActive = idx === currentStatusIndex;
              return (
                <div key={idx} className={`timeline-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                  <div className="timeline-dot">{idx + 1}</div>
                  <div className="timeline-label">{step}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="order-grid">
        {/* Left Side: General Info, Items, Payments */}
        <div>
          {/* Order Info & Status */}
          <div className="order-card">
            <h3>General Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px" }}>
              <div>
                <span className="text-muted text-sm">Order ID</span>
                <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1e293b" }}>{order.order_id}</p>
              </div>
              <div>
                <span className="text-muted text-sm">Placed On</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600, color: "#1e293b" }}>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted text-sm">Order Status</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`badge ${orderStatus === "Cancelled" || orderStatus === "QC Failed" ? "badge-error" : orderStatus === "Delivered" ? "badge-muted" : "badge-success"}`}>
                    {orderStatus}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted text-sm">Last Update</span>
                <p style={{ margin: "4px 0 0", fontWeight: 500, color: "#64748b" }}>{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="order-card" style={{ padding: "20px 0" }}>
            <h3 style={{ padding: "0 24px 10px", margin: "0 0 10px" }}>Purchased Items</h3>
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Unit Price (₹)</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="item-preview">
                        {item.product?.image?.url ? (
                          <img src={item.product.image.url} alt={item.name} className="item-img" />
                        ) : (
                          <div className="item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📦</div>
                        )}
                        <div>
                          <div className="item-info-name">{item.name}</div>
                          <div className="item-info-sku">SKU: {item.product?.sku || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>₹{parseFloat(item.sellPrice || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>₹{parseFloat(item.sellPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Info */}
          <div className="order-card">
            <h3>Payment Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
              <div>
                <span className="text-muted text-sm">Payment Method</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`badge-method ${order.paymentInfo?.method === "COD" ? "badge-cod" : order.paymentInfo?.method === "Wallet" ? "badge-wallet" : "badge-online"}`}>
                    {order.paymentInfo?.method || "COD"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted text-sm">Payment Status</span>
                <div style={{ marginTop: "4px" }}>
                  <span className={`badge ${paymentStatus === "Paid" ? "badge-success" : paymentStatus === "Failed" ? "badge-error" : "badge-error"}`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
              {order.paymentInfo?.transactionId && (
                <div>
                  <span className="text-muted text-sm">Transaction ID</span>
                  <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: "13px", fontWeight: "600" }}>{order.paymentInfo.transactionId}</p>
                </div>
              )}
              {order.paymentInfo?.razorpayPaymentId && (
                <div>
                  <span className="text-muted text-sm">Razorpay Payment ID</span>
                  <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: "13px", fontWeight: "600" }}>{order.paymentInfo.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Operational controls, Address, Invoice totals */}
        <div>
          {/* Operations: Update Status Panel */}
          {canEdit && (
            <div className="order-card operation-card">
              <h3>Admin Actions</h3>
              
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontWeight: "600" }}>Change Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Placed">Placed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Processing">Processing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Return Requested">Return Requested</option>
                  <option value="Return Approved">Return Approved</option>
                  <option value="Returned">Returned</option>
                  <option value="QC Failed">QC Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ fontWeight: "600" }}>Change Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdate}
                disabled={isUpdating}
                style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
              >
                {isUpdating ? "Updating..." : "Save Status Changes"}
              </button>
            </div>
          )}

          {/* Shipping Address */}
          <div className="order-card addr-info">
            <h3>Shipping Details</h3>
            <p><strong>Recipient Name:</strong> {order.shippingAddress?.name}</p>
            <p><strong>Mobile Number:</strong> {order.shippingAddress?.mobile}</p>
            {order.shippingAddress?.alternateMobile && (
              <p><strong>Alt Mobile:</strong> {order.shippingAddress.alternateMobile}</p>
            )}
            <p style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f8fafc" }}>
              {order.shippingAddress?.addressLine1}<br />
              {order.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
              {order.shippingAddress?.landmark && <><small style={{ fontStyle: "italic", color: "#64748b" }}>Landmark: {order.shippingAddress.landmark}</small><br /></>}
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong>{order.shippingAddress?.pincode}</strong>
            </p>
            <p style={{ marginTop: "10px" }}>
              <span className="badge-method badge-cod" style={{ fontSize: "11px" }}>Tag: {order.shippingAddress?.addressType || "Home"}</span>
            </p>
          </div>

          {/* Pricing Invoice Summary */}
          <div className="order-card">
            <h3>Invoice Summary</h3>
            <div className="pricing-summary-list">
              <div className="pricing-row">
                <span>Items Subtotal</span>
                <span>₹{parseFloat(order.pricing?.itemsPrice || 0).toFixed(2)}</span>
              </div>
              <div className="pricing-row">
                <span>GST Tax (Included)</span>
                <span>₹{parseFloat(order.pricing?.gstAmount || 0).toFixed(2)}</span>
              </div>
              <div className="pricing-row">
                <span>Shipping Charges</span>
                <span>₹{parseFloat(order.pricing?.shippingPrice || 0).toFixed(2)}</span>
              </div>
              {order.pricing?.couponDiscount > 0 && (
                <div className="pricing-row" style={{ color: "#22c55e", fontWeight: "600" }}>
                  <span>Coupon Discount ({order.pricing.couponCode})</span>
                  <span>-₹{parseFloat(order.pricing.couponDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="pricing-row total">
                <span>Grand Total</span>
                <span>₹{parseFloat(order.pricing?.totalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
