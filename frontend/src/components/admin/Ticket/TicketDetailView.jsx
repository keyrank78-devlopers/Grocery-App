import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_OPTIONS = ["Open", "In-Progress", "Resolved", "Closed"];

const STATUS_STYLE = {
  "Open":        { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  "In-Progress": { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  "Resolved":    { bg: "#dcfce7", color: "#166534", border: "#86efac" },
  "Closed":      { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
};

const PRIORITY_STYLE = {
  "Low":    { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
  "Medium": { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  "High":   { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Open"];
  return (
    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLE[priority] || PRIORITY_STYLE["Low"];
  return (
    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
      {priority}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

export default function TicketDetailView({ ticketId, onBack, onTicketUpdated }) {
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/tickets/${ticketId}`, { withCredentials: true });
      setTicket(res.data.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load ticket details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    if (ticket?.status === "Closed") { showToast("Cannot reply to a closed ticket", "error"); return; }
    setIsSending(true);
    try {
      const res = await axios.post(`${BASE_URL}/tickets/${ticketId}/admin-reply`, { message: replyText.trim() }, { withCredentials: true });
      setTicket(res.data.data);
      setReplyText("");
      onTicketUpdated?.(res.data.data);
      showToast("Reply sent!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send reply", "error");
    } finally { setIsSending(false); }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await axios.put(`${BASE_URL}/tickets/${ticketId}/status`, { status: newStatus }, { withCredentials: true });
      setTicket(res.data.data);
      onTicketUpdated?.(res.data.data);
      showToast(`Status updated to "${newStatus}"`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally { setIsUpdatingStatus(false); }
  };

  if (loading) return (
    <div className="content-section active" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
      <div style={{ textAlign: "center", color: "#6c757d" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: "14px" }}>Loading ticket...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!ticket) return null;

  const customer = ticket.customer;
  const isClosed = ticket.status === "Closed";
  const customerName = typeof customer === "object" ? customer?.name : null;
  const customerMobile = typeof customer === "object" ? customer?.mobile : null;
  const customerEmail = typeof customer === "object" ? customer?.email : null;

  return (
    <div className="content-section active">
      <style>{`
        .tkt-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }
        @media (max-width: 900px) { .tkt-grid { grid-template-columns: 1fr; } }
        .tkt-msg-bubble { max-width: 75%; }
        .tkt-reply-textarea { width: 100%; border-radius: 8px; border: 1.5px solid #e5e7eb; padding: 12px 14px; font-size: 14px; resize: vertical; outline: none; font-family: inherit; line-height: 1.6; box-sizing: border-box; transition: border-color 0.15s; }
        .tkt-reply-textarea:focus { border-color: #0d6efd; }
        .tkt-status-btn { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
        .tkt-action-btn { width: 100%; padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1.5px solid; cursor: pointer; text-align: left; transition: all 0.15s; margin-bottom: 6px; }
        .tkt-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .tkt-action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button className="btn btn-outline btn-sm" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>{ticket.subject}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="staff-id-badge">{ticket.ticketId}</span>
              <span style={{ fontSize: "12px", color: "#6c757d" }}>{ticket.category}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        {/* Status switcher */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((s) => {
            const st = STATUS_STYLE[s];
            const active = ticket.status === s;
            return (
              <button key={s} className="tkt-status-btn"
                onClick={() => handleStatusChange(s)}
                disabled={isUpdatingStatus}
                style={{
                  background: active ? st.bg : "#fff",
                  color: active ? st.color : "#6c757d",
                  borderColor: active ? st.border : "#e5e7eb",
                  boxShadow: active ? `0 0 0 2px ${st.border}` : "none",
                }}>
                {active ? `● ${s}` : s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tkt-grid">

        {/* ── Left: Chat + Reply ── */}
        <div>

          {/* Chat Thread */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "16px" }}>
            {/* Thread header */}
            <div style={{ padding: "14px 20px", background: "#f8f9fa", borderBottom: "1px solid #e9ecef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Conversation</span>
              <span style={{ fontSize: "12px", color: "#6c757d", background: "#e9ecef", padding: "3px 10px", borderRadius: "12px" }}>
                {ticket.messages?.length || 0} messages
              </span>
            </div>

            {/* Messages */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "480px", overflowY: "auto" }}>
              {(ticket.messages || []).length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>No messages yet.</p>
              ) : (
                (ticket.messages || []).map((msg, idx) => {
                  const isAdmin = msg.sender === "Admin" || msg.sender === "Staff";
                  return (
                    <div key={msg._id || idx} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                      <div className="tkt-msg-bubble" style={{
                        background: isAdmin ? "#f0fdf4" : "#f0f4ff",
                        border: `1px solid ${isAdmin ? "#bbf7d0" : "#c7d7fe"}`,
                        borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        padding: "12px 16px",
                      }}>
                        {/* Name + time */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: isAdmin ? "#166534" : "#1e40af" }}>
                            {isAdmin ? "🛡️" : "👤"} {msg.senderName || (isAdmin ? "Support Team" : "Customer")}
                            {msg.sender === "Staff" && <span style={{ marginLeft: "4px", fontSize: "10px", background: "#e9d5ff", color: "#7e22ce", padding: "1px 6px", borderRadius: "8px" }}>Staff</span>}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply Box */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                {isClosed ? "🔒 Ticket Closed" : "Reply to Customer"}
              </h3>
              {!isClosed && <span style={{ fontSize: "12px", color: "#9ca3af" }}>Ctrl + Enter to send</span>}
            </div>

            {isClosed ? (
              <div style={{ background: "#f8f9fa", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "20px", textAlign: "center", color: "#6c757d", fontSize: "14px" }}>
                This ticket is closed. Change status to reply again.
              </div>
            ) : (
              <>
                <textarea
                  className="tkt-reply-textarea"
                  rows={4}
                  placeholder="Write your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(); }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button type="button" className="btn btn-primary"
                    onClick={handleReply}
                    disabled={isSending || !replyText.trim()}
                    style={{ minWidth: "130px" }}>
                    {isSending ? "Sending..." : "📤 Send Reply"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Info Panels ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Ticket Details */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>Ticket Details</p>
            <InfoRow label="Ticket ID" value={<span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px" }}>{ticket.ticketId}</span>} />
            <InfoRow label="Status" value={<StatusBadge status={ticket.status} />} />
            <InfoRow label="Priority" value={<PriorityBadge priority={ticket.priority} />} />
            <InfoRow label="Category" value={ticket.category} />
            <InfoRow label="Created" value={formatDateTime(ticket.createdAt)} />
            <InfoRow label="Updated" value={formatDateTime(ticket.updatedAt)} />
            <InfoRow label="Messages" value={`${ticket.messages?.length || 0}`} />
          </div>

          {/* Customer Info */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>Customer</p>

            {customerName ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #0f2f36, #1a6b56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "18px", flexShrink: 0 }}>
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>{customerName}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6c757d" }}>Customer</p>
                  </div>
                </div>
                <InfoRow label="Mobile" value={customerMobile} />
                <InfoRow label="Email" value={customerEmail} />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0", color: "#9ca3af", fontSize: "13px" }}>
                Customer info unavailable
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>Change Status</p>
            {STATUS_OPTIONS.filter((s) => s !== ticket.status).map((s) => {
              const st = STATUS_STYLE[s];
              return (
                <button key={s} className="tkt-action-btn"
                  onClick={() => handleStatusChange(s)}
                  disabled={isUpdatingStatus}
                  style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                  {isUpdatingStatus ? "Updating..." : `Mark as ${s}`}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
