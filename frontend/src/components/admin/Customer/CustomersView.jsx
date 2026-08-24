import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import CustomerDetailView from "./CustomerDetailView";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CustomersView() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ── Filters State ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Detail Page Navigation ─────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Fetch all customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/customers`, {
        withCredentials: true,
      });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load customers list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Block / Unblock Toggle from list ──────────────────────────
  const handleToggleStatus = async (customer) => {
    if (togglingId) return;
    setTogglingId(customer._id);
    try {
      const res = await axios.patch(
        `${BASE_URL}/admin/customers/${customer._id}/toggle-status`,
        {},
        { withCredentials: true }
      );
      const { isActive } = res.data.data;
      setCustomers((prev) =>
        prev.map((c) => (c._id === customer._id ? { ...c, isActive } : c))
      );
      showToast(
        `Customer ${isActive ? "unblocked" : "blocked"} successfully`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to update customer status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Called from CustomerDetailView when status changes ────────
  const handleDetailToggle = (id, isActive) => {
    setCustomers((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive } : c))
    );
    showToast(
      `Customer ${isActive ? "unblocked" : "blocked"} successfully`,
      "success"
    );
  };

  // ── Client-Side Filtering ──────────────────────────────────────
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.customer_id?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term) ||
      c.mobile?.includes(term) ||
      c.email?.toLowerCase().includes(term);

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // ── If a customer is selected, render detail page ──────────────
  if (selectedCustomerId) {
    return (
      <CustomerDetailView
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
        onToggleStatus={handleDetailToggle}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px" }}>Loading customers...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Customer Management</h2>
        </div>
        <div style={{ fontSize: "14px", color: "#6c757d", fontWeight: 500 }}>
          Total: {customers.length} customers
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1", minWidth: "250px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by ID, Name, Mobile, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px" }}
          />
          <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div style={{ minWidth: "150px" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", cursor: "pointer", height: "42px", padding: "10px 14px" }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Blocked</option>
          </select>
        </div>

        {(searchTerm || statusFilter) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => { setSearchTerm(""); setStatusFilter(""); }}
            style={{ height: "42px", padding: "0 18px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px", fontWeight: "600", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Customers Table ── */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Wallet Balance</th>
              <th>Joined</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "#6c757d" }}>
                  No customers found matching the search/filters.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((cust) => (
                <tr
                  key={cust._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCustomerId(cust._id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <span className="staff-id-badge">{cust.customer_id || "N/A"}</span>
                  </td>
                  <td><strong>{cust.name || "Unnamed"}</strong></td>
                  <td>{cust.mobile}</td>
                  <td>
                    {cust.email
                      ? <span className="text-muted">{cust.email}</span>
                      : <span className="text-muted" style={{ fontStyle: "italic" }}>Not set</span>
                    }
                  </td>
                  <td><strong style={{ color: "#2b3543" }}>₹{(cust.walletBalance || 0).toFixed(2)}</strong></td>
                  <td>
                    <span className="text-muted" style={{ fontSize: "13px" }}>
                      {new Date(cust.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${cust.isActive ? "badge-success" : "badge-error"}`}>
                      {cust.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="staff-actions">
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedCustomerId(cust._id)}
                      >
                        View Details
                      </button>
                      <button
                        className={`btn btn-outline btn-xs ${cust.isActive ? "text-danger" : "text-success"}`}
                        onClick={() => handleToggleStatus(cust)}
                        disabled={togglingId === cust._id}
                      >
                        {togglingId === cust._id ? "..." : cust.isActive ? "Block" : "Unblock"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", gap: "5px" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
