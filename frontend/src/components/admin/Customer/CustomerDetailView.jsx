import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const S = {
  // Page wrapper
  page: { padding: "0" },

  // Back bar
  backBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "20px", flexWrap: "wrap", gap: "10px",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "none", border: "1px solid #dee2e6", borderRadius: "8px",
    padding: "7px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
    color: "#495057", transition: "all 0.2s",
  },

  // Hero banner
  hero: {
    background: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 100%)",
    borderRadius: "14px", padding: "28px 32px",
    display: "flex", alignItems: "center", gap: "20px",
    marginBottom: "24px", flexWrap: "wrap",
  },
  avatar: {
    width: "68px", height: "68px", borderRadius: "50%",
    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "26px", fontWeight: 700, color: "#fff", flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.3)",
  },
  heroName: { color: "#fff", margin: "0 0 4px", fontSize: "20px", fontWeight: 700 },
  heroSub: { color: "rgba(255,255,255,0.65)", margin: 0, fontSize: "13px" },
  heroBadge: (active) => ({
    padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
    background: active ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)",
    color: active ? "#34d399" : "#f87171",
    border: `1px solid ${active ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)"}`,
  }),

  // Stat strip
  statStrip: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "12px", marginBottom: "24px",
  },
  statCard: {
    background: "#fff", border: "1px solid #e9ecef", borderRadius: "12px",
    padding: "16px 18px",
  },
  statLabel: { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#9ca3af", marginBottom: "6px" },
  statValue: { fontSize: "18px", fontWeight: 700, color: "#111827" },

  // Tab bar
  tabBar: { display: "flex", borderBottom: "2px solid #e9ecef", marginBottom: "24px" },
  tab: (active) => ({
    padding: "10px 22px", fontSize: "14px", fontWeight: 600,
    background: "none", border: "none", cursor: "pointer",
    color: active ? "#2563eb" : "#6c757d",
    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
    marginBottom: "-2px", transition: "all 0.18s",
  }),

  // Cards
  card: {
    background: "#fff", border: "1px solid #e9ecef",
    borderRadius: "12px", overflow: "hidden", marginBottom: "16px",
  },
  cardHead: {
    padding: "14px 20px", borderBottom: "1px solid #f1f3f5",
    display: "flex", alignItems: "center", gap: "8px",
  },
  cardTitle: { fontSize: "14px", fontWeight: 700, color: "#111827", margin: 0 },
  cardBody: { padding: "20px" },

  // Info rows
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "9px 0", borderBottom: "1px solid #f8f9fa", fontSize: "14px",
  },
  infoLabel: { color: "#6b7280", flex: "0 0 150px" },
  infoVal: { color: "#111827", fontWeight: 600, textAlign: "right", wordBreak: "break-all", flex: 1 },

  // Address card
  addrCard: {
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: "10px", padding: "14px 16px", fontSize: "13px", lineHeight: "1.7",
  },

  // Empty state
  empty: { textAlign: "center", padding: "52px 20px", color: "#9ca3af" },

  // Order header
  orderHero: {
    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
    borderRadius: "12px", padding: "20px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: "12px", marginBottom: "20px",
  },
};

const CardHead = ({ icon, title }) => (
  <div style={S.cardHead}>
    <span style={{ fontSize: "16px" }}>{icon}</span>
    <p style={S.cardTitle}>{title}</p>
  </div>
);

const InfoRow = ({ label, value, valueStyle }) => (
  <div style={S.infoRow}>
    <span style={S.infoLabel}>{label}</span>
    <span style={{ ...S.infoVal, ...valueStyle }}>{value}</span>
  </div>
);

export default function CustomerDetailView({ customerId, onBack, onToggleStatus }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/admin/customers/${customerId}`, {
          withCredentials: true,
        });
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customerId]);

  const handleToggle = async () => {
    if (togglingStatus) return;
    setTogglingStatus(true);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/customers/${customerId}/toggle-status`,
        {}, { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setData((prev) => ({ ...prev, profile: { ...prev.profile, isActive } }));
      if (onToggleStatus) onToggleStatus(customerId, isActive);
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="content-section active" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: "#6c757d" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #dee2e6", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: "14px" }}>Loading customer profile...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, orders = [], addresses = [], walletTransactions = [] } = data;

  const tabs = [
    { id: "profile", label: "Profile & Addresses" },
    { id: "orders", label: `Orders (${orders.length})` },
    { id: "wallet", label: `Wallet (${walletTransactions.length})` },
  ];

  const totalSpend = orders.reduce((sum, o) => sum + (o.pricing?.totalPrice || 0), 0);

  return (
    <div className="content-section active" style={S.page}>

      {/* ── Top Bar: Back + Block Button ── */}
      <div style={S.backBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={S.backBtn} onClick={onBack}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Customers
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>Customer Details</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>{profile.customer_id} · {profile.mobile}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglingStatus}
          style={{
            padding: "9px 20px", fontWeight: 600, fontSize: "13px", border: "none",
            borderRadius: "8px", cursor: togglingStatus ? "not-allowed" : "pointer",
            background: profile.isActive ? "#fef2f2" : "#f0fdf4",
            color: profile.isActive ? "#dc2626" : "#16a34a",
            border: `1px solid ${profile.isActive ? "#fecaca" : "#bbf7d0"}`,
            transition: "all 0.2s",
          }}
        >
          {togglingStatus ? "Updating..." : profile.isActive ? "🚫 Block Customer" : "✅ Unblock Customer"}
        </button>
      </div>

      {/* ── Hero Banner ── */}
      <div style={S.hero}>
        <div style={S.avatar}>{(profile.name || "?").charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h2 style={S.heroName}>{profile.name || "Unnamed Customer"}</h2>
          <p style={S.heroSub}>{profile.mobile}{profile.email ? ` · ${profile.email}` : ""}</p>
          <p style={{ ...S.heroSub, marginTop: "4px", fontSize: "12px" }}>
            Joined {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <span style={S.heroBadge(profile.isActive)}>
          {profile.isActive ? "● Active" : "● Blocked"}
        </span>
      </div>

      {/* ── Stats Strip ── */}
      <div style={S.statStrip}>
        {[
          { label: "Wallet Balance", value: `₹${(profile.walletBalance || 0).toFixed(2)}`, color: "#059669" },
          { label: "Total Orders", value: orders.length, color: "#2563eb" },
          { label: "Total Spend", value: `₹${totalSpend.toFixed(2)}`, color: "#7c3aed" },
          { label: "Saved Addresses", value: addresses.length, color: "#d97706" },
          { label: "Wallet Txns", value: walletTransactions.length, color: "#0891b2" },
        ].map((s) => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            style={S.tab(activeTab === t.id)}
            onClick={() => { setActiveTab(t.id); setSelectedOrder(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TAB 1 — Profile & Addresses
      ════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Personal Info */}
          <div style={S.card}>
            <CardHead icon="👤" title="Personal Information" />
            <div style={S.cardBody}>
              {[
                { label: "Customer ID", value: profile.customer_id },
                { label: "Full Name", value: profile.name || "Not set" },
                { label: "Mobile", value: profile.mobile },
                { label: "Email", value: profile.email || "Not provided" },
                { label: "Account Status", value: profile.isActive ? "Active" : "Blocked" },
              ].map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </div>

          {/* Financial Info */}
          <div style={S.card}>
            <CardHead icon="💳" title="Financial Summary" />
            <div style={S.cardBody}>
              {[
                { label: "Wallet Balance", value: `₹${(profile.walletBalance || 0).toFixed(2)}`, valueStyle: { color: "#059669" } },
                { label: "Total Orders", value: orders.length },
                { label: "Total Spend", value: `₹${totalSpend.toFixed(2)}`, valueStyle: { color: "#7c3aed" } },
                { label: "Txn Records", value: walletTransactions.length },
                { label: "Joined On", value: new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
              ].map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} valueStyle={row.valueStyle} />
              ))}
            </div>
          </div>

          {/* Addresses — full width */}
          <div style={{ ...S.card, gridColumn: "1 / -1" }}>
            <CardHead icon="📍" title={`Saved Addresses (${addresses.length})`} />
            <div style={S.cardBody}>
              {addresses.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                  <p>No delivery addresses saved yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                  {addresses.map((addr) => (
                    <div key={addr._id} style={S.addrCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#374151" }}>
                          {addr.addressType || "Address"}
                        </span>
                        {addr.isDefault && (
                          <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 700 }}>
                            Default
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, color: "#111827", marginBottom: "2px" }}>{addr.name}</div>
                      <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>📞 {addr.mobile}{addr.alternateMobile ? ` / ${addr.alternateMobile}` : ""}</div>
                      <div style={{ color: "#374151" }}>
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
                        {addr.city}, {addr.state} – {addr.pincode}
                        {addr.landmark && <><br /><span style={{ color: "#9ca3af", fontSize: "12px" }}>Near: {addr.landmark}</span></>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 2 — Orders
      ════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <>
          {selectedOrder ? (
            /* ── Full Order Detail ── */
            <div>
              <button
                style={{ ...S.backBtn, marginBottom: "18px" }}
                onClick={() => setSelectedOrder(null)}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Orders
              </button>

              {/* Order Hero */}
              <div style={S.orderHero}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>Order ID</p>
                  <h3 style={{ color: "#fff", margin: "0 0 6px", fontSize: "22px" }}>{selectedOrder.order_id}</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: 0 }}>
                    Placed {new Date(selectedOrder.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", fontWeight: 700, fontSize: "12px", background: selectedOrder.paymentInfo?.status === "Paid" ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)", color: selectedOrder.paymentInfo?.status === "Paid" ? "#34d399" : "#fbbf24", border: "1px solid currentColor" }}>
                    💳 {selectedOrder.paymentInfo?.status || "Pending"}
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: "20px", fontWeight: 700, fontSize: "12px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.2)" }}>
                    📦 {selectedOrder.orderStatus}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div style={S.card}>
                <CardHead icon="🛒" title="Ordered Items" />
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>MRP</th>
                        <th>Sell Price</th>
                        <th>Qty</th>
                        <th className="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={item._id}>
                          <td style={{ color: "#9ca3af", fontSize: "13px" }}>{idx + 1}</td>
                          <td><strong>{item.name}</strong></td>
                          <td style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "13px" }}>₹{(item.mrp || 0).toFixed(2)}</td>
                          <td style={{ color: "#059669", fontWeight: 700 }}>₹{(item.sellPrice || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>× {item.quantity}</td>
                          <td className="text-right"><strong>₹{((item.sellPrice || 0) * (item.quantity || 1)).toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lower grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

                {/* Pricing */}
                <div style={S.card}>
                  <CardHead icon="🧾" title="Pricing Breakdown" />
                  <div style={S.cardBody}>
                    {[
                      { label: "Items Subtotal", value: `₹${(selectedOrder.pricing?.itemsPrice || 0).toFixed(2)}` },
                      { label: `Coupon ${selectedOrder.pricing?.couponCode ? `(${selectedOrder.pricing.couponCode})` : ""}`, value: `-₹${(selectedOrder.pricing?.couponDiscount || 0).toFixed(2)}`, color: "#dc2626" },
                      { label: "GST", value: `₹${(selectedOrder.pricing?.gstAmount || 0).toFixed(2)}` },
                      { label: "Shipping", value: (selectedOrder.pricing?.shippingPrice || 0) === 0 ? "FREE" : `₹${selectedOrder.pricing.shippingPrice.toFixed(2)}`, color: "#059669" },
                    ].map((r) => (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                        <span style={{ color: "#6b7280" }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: r.color || "#111827" }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", fontSize: "16px", fontWeight: 700 }}>
                      <span>Total Payable</span>
                      <span style={{ color: "#2563eb" }}>₹{(selectedOrder.pricing?.totalPrice || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment + Shipping stacked */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Payment */}
                  <div style={S.card}>
                    <CardHead icon="💳" title="Payment Info" />
                    <div style={S.cardBody}>
                      {[
                        { label: "Method", value: selectedOrder.paymentInfo?.method },
                        { label: "Status", value: selectedOrder.paymentInfo?.status || "Pending" },
                        { label: "Transaction ID", value: selectedOrder.paymentInfo?.transactionId || "N/A" },
                      ].map((r) => (
                        <InfoRow key={r.label} label={r.label} value={r.value} />
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div style={S.card}>
                    <CardHead icon="📦" title="Shipping Address" />
                    <div style={{ ...S.cardBody, fontSize: "13px", lineHeight: "1.75" }}>
                      {selectedOrder.shippingAddress ? (
                        <>
                          <div style={{ fontWeight: 700, color: "#111827" }}>
                            {selectedOrder.shippingAddress.name}
                            <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: "6px", fontSize: "12px" }}>({selectedOrder.shippingAddress.addressType})</span>
                          </div>
                          <div style={{ color: "#6b7280" }}>📞 {selectedOrder.shippingAddress.mobile}{selectedOrder.shippingAddress.alternateMobile ? ` / ${selectedOrder.shippingAddress.alternateMobile}` : ""}</div>
                          <div style={{ color: "#374151", marginTop: "4px" }}>
                            {selectedOrder.shippingAddress.addressLine1}{selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ""}<br />
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} – {selectedOrder.shippingAddress.pincode}
                          </div>
                          {selectedOrder.shippingAddress.landmark && (
                            <div style={{ color: "#9ca3af", marginTop: "4px" }}>🏢 {selectedOrder.shippingAddress.landmark}</div>
                          )}
                        </>
                      ) : <span style={{ color: "#9ca3af" }}>Not available</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.history?.length > 0 && (
                <div style={S.card}>
                  <CardHead icon="🕓" title="Order Status History" />
                  <div style={{ ...S.cardBody, display: "flex", flexDirection: "column", gap: "0" }}>
                    {selectedOrder.history.map((h, idx) => (
                      <div key={h._id} style={{ display: "flex", gap: "16px", paddingBottom: idx < selectedOrder.history.length - 1 ? "20px" : "0", position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: idx === 0 ? "#2563eb" : "#d1d5db", border: "2px solid #fff", boxShadow: "0 0 0 2px " + (idx === 0 ? "#2563eb" : "#d1d5db"), zIndex: 1 }} />
                          {idx < selectedOrder.history.length - 1 && (
                            <div style={{ width: "2px", flex: 1, background: "#e5e7eb", marginTop: "4px" }} />
                          )}
                        </div>
                        <div style={{ paddingTop: "0", paddingBottom: "4px" }}>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{h.status}</div>
                          <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "2px" }}>{h.message}</div>
                          <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "3px" }}>
                            {new Date(h.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Orders List ── */
            <div style={S.card}>
              {orders.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                  <p>No orders placed by this customer yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord._id} style={{ cursor: "pointer" }} onClick={() => setSelectedOrder(ord)}>
                        <td><span className="staff-id-badge">{ord.order_id}</span></td>
                        <td style={{ fontSize: "13px", color: "#6b7280" }}>
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td>{ord.items?.length || 0} item(s)</td>
                        <td><strong>₹{(ord.pricing?.totalPrice || 0).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${ord.paymentInfo?.status === "Paid" ? "badge-success" : ord.paymentInfo?.status === "Failed" ? "badge-error" : "badge-warning"}`}>
                            {ord.paymentInfo?.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>{ord.orderStatus}</span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-xs" onClick={() => setSelectedOrder(ord)}>View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — Wallet Transactions
      ════════════════════════════════════════ */}
      {activeTab === "wallet" && (
        <div style={S.card}>
          {walletTransactions.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>💸</div>
              <p>No wallet transactions logged for this customer.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {walletTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <span className="staff-id-badge" style={{ fontFamily: "monospace", fontSize: "11px" }}>
                        {tx.transactionId || "Internal"}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "#6b7280" }}>
                      {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td style={{ fontSize: "13px" }}>{tx.description}</td>
                    <td>
                      <span className={`badge ${tx.type === "Credit" ? "badge-success" : "badge-error"}`}>{tx.type}</span>
                    </td>
                    <td className="text-right">
                      <strong style={{ color: tx.type === "Credit" ? "#059669" : "#dc2626", fontSize: "14px" }}>
                        {tx.type === "Credit" ? "+" : "-"}₹{(tx.amount || 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
