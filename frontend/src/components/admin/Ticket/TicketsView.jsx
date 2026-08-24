import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import TicketDetailView from "./TicketDetailView";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_OPTIONS = ["", "Open", "In-Progress", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["", "Low", "Medium", "High"];
const CATEGORY_OPTIONS = [
  "", "Payment Issues", "Delivery Issues", "Refund Requests",
  "Product Feedback", "Account Issues", "Other",
];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const STATUS_STYLE = {
  "Open":        { background: "#dbeafe", color: "#1d4ed8" },
  "In-Progress": { background: "#fef9c3", color: "#92400e" },
  "Resolved":    { background: "#dcfce7", color: "#166534" },
  "Closed":      { background: "#f1f5f9", color: "#475569" },
};

const PRIORITY_STYLE = {
  "Low":    { background: "#f0fdf4", color: "#16a34a" },
  "Medium": { background: "#fff7ed", color: "#c2410c" },
  "High":   { background: "#fef2f2", color: "#dc2626" },
};

export default function TicketsView() {
  const { showToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ── Filters ────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ── Pagination ─────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchTickets = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pg);
      params.append("limit", pageSize);
      if (statusFilter)   params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await axios.get(
        `${BASE_URL}/tickets/admin/all?${params.toString()}`,
        { withCredentials: true }
      );
      setTickets(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      showToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(page);
  }, [page, pageSize, statusFilter, priorityFilter, categoryFilter]);

  // ── Client-side search ─────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      t.subject?.toLowerCase().includes(q) ||
      t.ticketId?.toLowerCase().includes(q) ||
      t.customer?.name?.toLowerCase().includes(q) ||
      t.customer?.email?.toLowerCase().includes(q) ||
      t.customer?.mobile?.includes(q)
    );
  }, [tickets, search]);

  const clearFilters = () => {
    setSearch(""); setStatusFilter(""); setPriorityFilter(""); setCategoryFilter("");
    setPage(1);
  };
  const hasFilters = search || statusFilter || priorityFilter || categoryFilter;

  // ── Ticket updated from detail view ───────────────────────────
  const handleTicketUpdated = (updatedTicket) => {
    setTickets((prev) => prev.map((t) => t._id === updatedTicket._id ? { ...t, ...updatedTicket } : t));
    setSelectedTicket(updatedTicket);
  };

  // ── Detail View ────────────────────────────────────────────────
  if (selectedTicket) {
    return (
      <TicketDetailView
        ticketId={selectedTicket._id}
        onBack={() => setSelectedTicket(null)}
        onTicketUpdated={handleTicketUpdated}
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
            <p style={{ fontSize: "14px" }}>Loading tickets...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Support Tickets</h2>
          <p className="page-subtitle">View and respond to customer support requests</p>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: "10px" }}>
          {["Open", "In-Progress"].map((s) => {
            const count = tickets.filter((t) => t.status === s).length;
            return (
              <div key={s} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, ...STATUS_STYLE[s] }}>
                {s}: {count}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="staff-filter-bar" style={{ marginBottom: "16px" }}>
        <div className="staff-search-wrap" style={{ flex: 1, minWidth: "200px" }}>
          <svg className="staff-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" strokeLinecap="round" />
          </svg>
          <input type="text" className="staff-search-input"
            placeholder="Search by subject, ID, customer..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button type="button" className="staff-clear-search" onClick={() => setSearch("")}>×</button>}
        </div>

        <select className="staff-filter-select" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="staff-filter-select" value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select className="staff-filter-select" value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {hasFilters && (
          <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="staff-table-meta" style={{ marginBottom: "8px" }}>
        <span className="text-muted text-sm">
          {total === 0 ? "No tickets found" : `Showing ${filteredTickets.length} of ${total} tickets`}
        </span>
        <div className="staff-page-size">
          <label className="text-muted text-sm">Rows per page</label>
          <select className="staff-filter-select staff-page-size-select" value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="staff-table-scroll">
          <table className="data-table staff-data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Last Updated</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                    <div>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎫</div>
                      <p style={{ fontWeight: 600 }}>No tickets found</p>
                      <p style={{ fontSize: "13px" }}>{hasFilters ? "Try adjusting your filters" : "No support tickets yet"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t._id} style={{ cursor: "pointer" }} onClick={() => setSelectedTicket(t)}>
                    <td><span className="staff-id-badge">{t.ticketId}</span></td>
                    <td>
                      <div>
                        <strong style={{ fontSize: "13px" }}>{t.customer?.name || "—"}</strong>
                        <span className="text-muted text-sm" style={{ display: "block" }}>{t.customer?.mobile || t.customer?.email || ""}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 500, maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subject}
                      </span>
                    </td>
                    <td><span style={{ fontSize: "12px", color: "#6c757d" }}>{t.category}</span></td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, ...PRIORITY_STYLE[t.priority] }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, ...STATUS_STYLE[t.status] }}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "#6c757d" }}>
                        {t.messages?.length || 0} msg{(t.messages?.length || 0) !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#6c757d" }}>
                      {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-outline btn-xs"
                        onClick={() => setSelectedTicket(t)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="staff-pagination">
            <button type="button" className="btn btn-outline btn-sm"
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <div className="staff-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`e-${idx}`} className="staff-page-ellipsis">…</span>
                  ) : (
                    <button key={item} type="button"
                      className={`staff-page-btn ${page === item ? "active" : ""}`}
                      onClick={() => setPage(item)}>
                      {item}
                    </button>
                  )
                )}
            </div>
            <button type="button" className="btn btn-outline btn-sm"
              disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
