import React, { useState } from "react";
import { MOCK_PRODUCTS } from "../mockData";
import Modal from "./Modal";

export default function ProductsView() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    mrp: "",
    price: "",
    stock: ""
  });

  const handleToggleStatus = (id) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" }
          : p
      )
    );
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price || !form.stock) return;

    const newProd = {
      id: `PROD-00${products.length + 1}`,
      icon: "📦",
      name: form.name,
      category: form.category,
      mrp: parseFloat(form.mrp || form.price),
      price: parseFloat(form.price),
      stock: `${form.stock} units`,
      status: "Active"
    };

    setProducts(prev => [...prev, newProd]);
    setForm({ name: "", category: "", mrp: "", price: "", stock: "" });
    setIsModalOpen(false);
    alert("Product Added Successfully!");
  };

  return (
    <div className="content-section active">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Product Management</h2>
          <p className="page-subtitle">Manage inventory, pricing, and product listings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Add Product
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thumbnail</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP (₹)</th>
              <th>Sell Price (₹)</th>
              <th>Stock</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isOutOfStock = parseInt(p.stock) === 0;
              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <div className="table-img-placeholder">{p.icon}</div>
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.category}</td>
                  <td>{parseFloat(p.mrp).toFixed(2)}</td>
                  <td>{parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`stock-indicator ${isOutOfStock ? "out-of-stock" : "in-stock"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === "Active" ? "badge-success" : "badge-error"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-outline btn-xs" style={{ marginRight: "4px" }}>Edit</button>
                    <button
                      className={`btn btn-outline btn-xs ${p.status === "Active" ? "text-danger" : "text-success"}`}
                      onClick={() => handleToggleStatus(p.id)}
                    >
                      {p.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product">
        <form onSubmit={handleAddProduct}>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amul Gold Milk"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                  <option value="Bakery & Bread">Bakery & Bread</option>
                </select>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-4">
              <div className="form-group">
                <label>MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 68.00"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 66.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Product Image</label>
            <input type="file" accept="image/*" />
          </div>
          <div className="form-group">
            <label>Product Description</label>
            <textarea rows="3" placeholder="Enter product detailed specifications..."></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
