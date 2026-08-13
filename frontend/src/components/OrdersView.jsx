import React, { useState } from "react";
import { MOCK_ORDERS } from "../mockData";
import Modal from "./Modal";

export default function OrdersView() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetails = (id) => {
    setSelectedOrderId(id);
    setIsModalOpen(true);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        status: newStatus
      }
    }));
    alert(`Order status successfully updated to ${newStatus}!`);
  };

  const activeOrder = selectedOrderId ? orders[selectedOrderId] : null;

  return (
    <div className="content-section active">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Order History</h2>
          <p className="page-subtitle">Track and manage all customer orders</p>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date / Time</th>
              <th>Customer</th>
              <th>Items Summary</th>
              <th>Total Price (₹)</th>
              <th>Method</th>
              <th>Order Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(orders).map((order) => {
              let statusClass = "badge-success";
              if (order.status === "Cancelled") statusClass = "badge-error";
              if (order.status === "Delivered") statusClass = "badge-muted";

              let methodClass = "badge-cod";
              if (order.payment.method.toLowerCase().includes("wallet")) methodClass = "badge-wallet";
              if (order.payment.method.toLowerCase().includes("online") || order.payment.method.toLowerCase().includes("razorpay")) methodClass = "badge-online";

              return (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.date}</td>
                  <td>
                    {order.customer.name} <br />
                    <small className="text-muted">{order.customer.mobile}</small>
                  </td>
                  <td>
                    {order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                  </td>
                  <td>{parseFloat(order.pricing.total).toFixed(2)}</td>
                  <td>
                    <span className={`badge-method ${methodClass}`}>{order.payment.method}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusClass}`}>{order.status}</span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-outline btn-xs" onClick={() => handleOpenDetails(order.order_id)}>
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeOrder ? `Order Detail - ${activeOrder.order_id}` : "Order Detail"}
      >
        {activeOrder && (
          <div>
            <div className="order-details-grid">
              <div className="order-detail-card">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> {activeOrder.customer.name}</p>
                <p><strong>Mobile:</strong> {activeOrder.customer.mobile}</p>
                <p><strong>Email:</strong> {activeOrder.customer.email}</p>
              </div>
              <div className="order-detail-card">
                <h4>Delivery Address</h4>
                <p>{activeOrder.address.line1}</p>
                <p>{activeOrder.address.city}, {activeOrder.address.state} - {activeOrder.address.pincode}</p>
                <p><small className="text-muted">Type: {activeOrder.address.type}</small></p>
              </div>
            </div>
            <div className="order-detail-card" style={{ marginBottom: "20px" }}>
              <h4>Order Info</h4>
              <p><strong>Order ID:</strong> {activeOrder.order_id}</p>
              <p><strong>Placed:</strong> {activeOrder.date}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`badge ${activeOrder.status === "Cancelled" ? "badge-error" : activeOrder.status === "Delivered" ? "badge-muted" : "badge-success"}`}>
                  {activeOrder.status}
                </span>
              </p>
              <p><strong>Payment Method:</strong> <span className="badge-method">{activeOrder.payment.method}</span></p>
              <p>
                <strong>Payment Status:</strong>{" "}
                <span className={`badge ${activeOrder.payment.status === 'Paid' ? 'badge-success' : 'badge-error'}`}>
                  {activeOrder.payment.status}
                </span>
              </p>
            </div>
            <div className="order-detail-card">
              <h4>Order Items</h4>
              <ul className="order-items-list">
                {activeOrder.items.map((item, idx) => (
                  <li key={idx} className="order-item-row">
                    <span>{item.name} <strong>x{item.quantity}</strong></span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
                <li className="order-item-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", marginTop: "8px", fontWeight: "600" }}>
                  <span>Grand Total</span>
                  <span>₹{parseFloat(activeOrder.pricing.total).toFixed(2)}</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: "20px" }} className="form-group">
              <label>Update Order Status (Mock Action)</label>
              <select
                value={activeOrder.status}
                onChange={(e) => handleStatusChange(activeOrder.order_id, e.target.value)}
              >
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
