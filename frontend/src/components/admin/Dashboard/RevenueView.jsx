import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Activity, 
  Calendar,
  Package,
  RotateCcw,
  CreditCard,
  Smartphone,
  Wallet
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function RevenueView() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalOrders: 0, codRevenue: 0, onlineRevenue: 0, walletRevenue: 0 },
    timeline: [],
    topProducts: [],
  });

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/admin/revenue`, {
        params: { startDate, endDate },
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
  }, [startDate, endDate]);

  const totalRevenue = data.summary.totalRevenue;
  
  const paymentMethods = [
    { id: "online", name: "Online Payment", value: data.summary.onlineRevenue, color: "#3b82f6", icon: <CreditCard size={16} /> },
    { id: "cod", name: "Cash on Delivery", value: data.summary.codRevenue, color: "#10b981", icon: <Package size={16} /> },
    { id: "wallet", name: "Wallet", value: data.summary.walletRevenue, color: "#f59e0b", icon: <Wallet size={16} /> },
  ].filter(d => d.value > 0);

  // Custom Donut Label
  const renderDonutCenter = () => {
    if (loading || paymentMethods.length === 0) return null;
    return (
      <div className="donut-center">
        <span className="donut-center-label">Total Revenue</span>
        <span className="donut-center-value">₹{totalRevenue >= 1000 ? (totalRevenue/1000).toFixed(1)+'k' : totalRevenue}</span>
      </div>
    );
  };

  if (loading && !data.timeline.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          .dashboard-container {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            min-height: 100vh;
            padding: 24px;
            color: #0f172a;
          }

          /* Utility Classes simulating Tailwind */
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .flex-col { flex-direction: column; }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
          .gap-6 { gap: 24px; }
          .w-full { width: 100%; }
          .h-full { height: 100%; }
          .min-h-\\[60vh\\] { min-height: 60vh; }
          
          /* Typography */
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14px; }
          .text-base { font-size: 16px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .text-2xl { font-size: 24px; }
          
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          
          .text-slate-400 { color: #94a3b8; }
          .text-slate-500 { color: #64748b; }
          .text-slate-700 { color: #334155; }
          .text-slate-900 { color: #0f172a; }
          .text-emerald-500 { color: #10b981; }
          .text-emerald-600 { color: #059669; }
          .text-rose-500 { color: #f43f5e; }
          .text-white { color: #ffffff; }

          /* Layout Grids */
          .grid-summary {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 24px;
            margin-bottom: 24px;
          }
          
          .grid-charts {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 24px;
          }

          @media (min-width: 640px) {
            .grid-summary { grid-template-columns: repeat(2, 1fr); }
          }
          
          @media (min-width: 1024px) {
            .grid-summary { grid-template-columns: repeat(3, 1fr); }
            .grid-charts { grid-template-columns: 2fr 1fr; }
            .dashboard-container { padding: 32px; }
          }

          /* Cards */
          .saas-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.02), 0 1px 2px -1px rgba(15, 23, 42, 0.01);
            padding: 24px;
            transition: all 0.2s ease-in-out;
          }
          .saas-card:hover {
            box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.02);
            border-color: #cbd5e1;
          }

          /* Header & Inputs */
          .header-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 32px;
          }
          @media (min-width: 768px) {
            .header-container {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
          }

          .date-filter-group {
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 4px;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
          }

          .date-input {
            border: none;
            outline: none;
            background: transparent;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            color: #334155;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
          }
          .date-input:hover { background: #f8fafc; }
          
          .divider {
            width: 1px;
            height: 20px;
            background: #e2e8f0;
            margin: 0 4px;
          }

          .btn-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
          }
          .btn-icon:hover {
            background: #f8fafc;
            color: #0f172a;
            border-color: #cbd5e1;
          }

          /* Summary Icons */
          .icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }
          .icon-box.blue { background: #eff6ff; color: #3b82f6; }
          .icon-box.emerald { background: #ecfdf5; color: #10b981; }
          .icon-box.purple { background: #f5f3ff; color: #8b5cf6; }

          .trend-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .trend-badge.positive { background: #ecfdf5; color: #059669; }
          .trend-badge.neutral { background: #f1f5f9; color: #64748b; }

          /* Chart Donut Center */
          .donut-container { position: relative; width: 100%; height: 260px; }
          .donut-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            pointer-events: none;
          }
          .donut-center-label { display: block; font-size: 12px; color: #64748b; font-weight: 500; }
          .donut-center-value { display: block; font-size: 20px; color: #0f172a; font-weight: 700; margin-top: 2px; }

          /* Custom Table */
          .table-container {
            width: 100%;
            overflow-x: auto;
          }
          .saas-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            text-align: left;
          }
          .saas-table th {
            padding: 16px;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
          }
          .saas-table td {
            padding: 16px;
            font-size: 14px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          .saas-table tr:last-child td { border-bottom: none; }
          .saas-table tr:hover td { background-color: #f8fafc; }
          
          .product-avatar {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }

          .rank-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
          }
          .rank-1 { background: #fef08a; color: #854d0e; }
          .rank-2 { background: #e2e8f0; color: #475569; }
          .rank-3 { background: #ffedd5; color: #9a3412; }
          .rank-other { color: #94a3b8; font-weight: 600; }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>

      {/* HEADER */}
      <div className="header-container">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Analytics</h1>
          <p className="text-sm text-slate-500" style={{ marginTop: '4px' }}>Comprehensive overview of financial performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="date-filter-group">
            <div className="flex items-center" style={{ paddingLeft: '12px' }}>
              <Calendar size={16} className="text-slate-400" />
            </div>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
            <div className="divider" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          
          {(startDate !== today || endDate !== today) && (
            <button onClick={() => { setStartDate(today); setEndDate(today); }} className="btn-icon">
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid-summary">
        {/* Total Revenue */}
        <div className="saas-card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div className="icon-box blue">
              <DollarSign size={24} />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} />
              <span>+12.5%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500" style={{ marginBottom: '4px' }}>Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-900">
            ₹{data.summary.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </h3>
        </div>

        {/* Completed Orders */}
        <div className="saas-card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div className="icon-box emerald">
              <ShoppingBag size={24} />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} />
              <span>+8.2%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500" style={{ marginBottom: '4px' }}>Completed Orders</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {data.summary.totalOrders.toLocaleString()}
          </h3>
        </div>

        {/* Avg Order Value */}
        <div className="saas-card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div className="icon-box purple">
              <Activity size={24} />
            </div>
            <div className="trend-badge neutral">
              <span>Stable</span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500" style={{ marginBottom: '4px' }}>Average Order Value</p>
          <h3 className="text-2xl font-bold text-slate-900">
            ₹{data.summary.totalOrders > 0 ? (data.summary.totalRevenue / data.summary.totalOrders).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : 0}
          </h3>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid-charts">
        {/* Revenue Trend Area Chart */}
        <div className="saas-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between" style={{ padding: '24px 24px 0 24px', marginBottom: '24px' }}>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-xs text-slate-500 mt-1">Daily revenue over the selected period</p>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '320px', paddingRight: '24px', paddingBottom: '24px' }}>
            {data.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dx={-10}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.1)', padding: '12px 16px' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '14px' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p className="text-sm font-medium">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Split Donut */}
        <div className="saas-card">
          <div style={{ marginBottom: '24px' }}>
            <h3 className="text-base font-bold text-slate-900">Payment Split</h3>
            <p className="text-xs text-slate-500 mt-1">Revenue by payment method</p>
          </div>
          
          <div className="donut-container">
            {paymentMethods.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString()}`}
                      contentStyle={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px' }}
                      itemStyle={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {renderDonutCenter()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <PieChart size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p className="text-sm font-medium">No payment data</p>
              </div>
            )}
          </div>

          {/* Custom Legend */}
          {paymentMethods.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: method.color }}></div>
                    <span className="text-slate-600 font-medium flex items-center gap-2">
                      <span style={{ color: method.color, opacity: 0.8 }}>{method.icon}</span>
                      {method.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs font-medium">
                      {Math.round((method.value / totalRevenue) * 100)}%
                    </span>
                    <span className="font-semibold text-slate-900">
                      ₹{method.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP SELLING PRODUCTS */}
      <div className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 className="text-base font-bold text-slate-900">Top Selling Products</h3>
          <p className="text-xs text-slate-500 mt-1">Highest performing items in this period</p>
        </div>
        
        <div className="table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                <th>Product Details</th>
                <th style={{ textAlign: 'right' }}>Quantity Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                    <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p className="text-sm font-medium">No product sales data available</p>
                  </td>
                </tr>
              ) : (
                data.topProducts.map((product, idx) => (
                  <tr key={product.productId}>
                    <td style={{ textAlign: 'center' }}>
                      <div className={`rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'}`}>
                        #{idx + 1}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="product-avatar">
                          <Smartphone size={20} color="#94a3b8" />
                        </div>
                        <span className="font-semibold text-slate-900" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', padding: '4px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        {product.totalSold} Units
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
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
