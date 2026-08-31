import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6"];

export default function RevenueView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, codRevenue: 0, onlineRevenue: 0, walletRevenue: 0 },
    timeline: [],
    topProducts: [],
  });

  // Date filters
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/admin/get-warehouses`, { withCredentials: true });
        let allWarehouses = res.data.data?.filter(w => w.isActive) || [];

        if (user && ["warehouse_manager", "agent"].includes(user.role)) {
          const assignedIds = user.assignedWarehouses?.map(w => typeof w === 'object' ? w.id || w._id : w) || [];
          allWarehouses = allWarehouses.filter(w => assignedIds.includes(w._id) || assignedIds.includes(w.warehouse_id));
          
          if (allWarehouses.length === 1) {
            setWarehouseFilter(allWarehouses[0]._id);
          }
        }
        
        setWarehouses(allWarehouses);
      } catch (err) {
        console.error("Fetch Warehouses Error:", err);
      }
    };
    fetchWarehouses();
  }, [user]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/revenue`, {
        params: { startDate, endDate, warehouseId: warehouseFilter },
        withCredentials: true,
      });
      setData(res.data.data);
    } catch (err) {
      console.error("Fetch Revenue Error:", err);
      showToast("Failed to fetch revenue data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, warehouseFilter]);

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setWarehouseFilter("");
  };

  const pieData = [
    { name: "COD", value: data.summary.codRevenue },
    { name: "Online", value: data.summary.onlineRevenue },
    { name: "Wallet", value: data.summary.walletRevenue },
  ].filter(d => d.value > 0);

  if (loading && !data.timeline.length) {
    return (
      <div className="content-section active" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ textAlign: "center", color: "#6c757d" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #dee2e6", borderTopColor: "#0d6efd", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px" }}>Loading revenue data...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section active">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div className="page-header-content">
          <h2>Revenue Analytics</h2>
          <p className="text-muted" style={{ marginTop: "4px" }}>Detailed breakdown of completed orders and revenue.</p>
        </div>
        
        {/* Date Filter & Warehouse */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", padding: "12px 16px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #eef2f6", flexWrap: "wrap" }}>
          
          {(!user || !["warehouse_manager", "agent"].includes(user.role) || warehouses.length > 1) && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>Warehouse:</span>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                style={{ border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "6px", fontSize: "14px", cursor: "pointer", background: "white" }}
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>From:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "#64748b" }}>To:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "6px", fontSize: "14px", cursor: "pointer" }}
            />
          </div>
          {(startDate !== today || endDate !== today || warehouseFilter !== "") && (
            <button 
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
                setWarehouseFilter("");
              }}
              style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div className="stat-card" style={{ padding: "24px", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(59,130,246,0.3)" }}>
          <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>₹</div>
          <div className="stat-info">
            <h3 style={{ color: "rgba(255,255,255,0.9)" }}>Total Revenue</h3>
            <p className="stat-value" style={{ color: "white" }}>₹{data.summary.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "24px", background: "white", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #eef2f6" }}>
          <div className="stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>📦</div>
          <div className="stat-info">
            <h3>Completed Orders</h3>
            <p className="stat-value" style={{ color: "#1e293b" }}>{data.summary.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "24px", background: "white", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #eef2f6" }}>
          <div className="stat-icon" style={{ background: "#f8fafc", color: "#64748b" }}>💳</div>
          <div className="stat-info">
            <h3>Avg Order Value</h3>
            <p className="stat-value" style={{ color: "#1e293b" }}>
              ₹{data.summary.totalOrders > 0 ? (data.summary.totalRevenue / data.summary.totalOrders).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : 0}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Timeline Chart */}
        <div className="card" style={{ padding: "24px", borderRadius: "16px", gridColumn: "span 2" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#1e293b" }}>Daily Revenue Trend</h3>
          <div style={{ width: "100%", height: "320px" }}>
            {data.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>No data for selected period</div>
            )}
          </div>
        </div>

        {/* Payment Split Chart */}
        <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#1e293b" }}>Payment Method Split</h3>
          <div style={{ width: "100%", height: "260px" }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>No data for selected period</div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="card" style={{ padding: "24px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "#1e293b" }}>Top Selling Products</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>#</th>
                <th>Product Name</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>No sales data for selected period</td>
                </tr>
              ) : (
                data.topProducts.map((product, idx) => (
                  <tr key={product.productId}>
                    <td style={{ color: "#64748b", fontWeight: "500" }}>{idx + 1}</td>
                    <td>
                      <strong style={{ color: "#1e293b", display: "block", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={product.name}>
                        {product.name}
                      </strong>
                    </td>
                    <td className="text-right">
                      <span style={{ display: "inline-block", background: "#f1f5f9", padding: "4px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                        {product.totalSold}
                      </span>
                    </td>
                    <td className="text-right" style={{ fontWeight: "600", color: "#10b981" }}>
                      ₹{product.revenueGenerated.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
