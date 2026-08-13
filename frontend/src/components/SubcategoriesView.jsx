import React, { useState } from "react";
import { MOCK_SUBCATEGORIES } from "../mockData";
import Modal from "./Modal";

export default function SubcategoriesView() {
  const [subcategories, setSubcategories] = useState(MOCK_SUBCATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentCat, setParentCat] = useState("");
  const [subName, setSubName] = useState("");

  const handleToggleStatus = (id) => {
    setSubcategories(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, status: sub.status === "Active" ? "Inactive" : "Active" }
          : sub
      )
    );
  };

  const handleAddSubcategory = (e) => {
    e.preventDefault();
    if (!subName.trim() || !parentCat) return;

    const newId = `SUB-00${subcategories.length + 1}`;
    const newSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newSub = {
      id: newId,
      icon: "📁",
      name: subName,
      parent: parentCat,
      slug: newSlug,
      status: "Active"
    };

    setSubcategories(prev => [...prev, newSub]);
    setSubName("");
    setParentCat("");
    setIsModalOpen(false);
    alert("Subcategory Added Successfully!");
  };

  return (
    <div className="content-section active">
      <div className="page-header">
        <div className="page-header-content">
          <h2>Subcategory Management</h2>
          <p className="page-subtitle">Manage subcategories under parent categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Add Subcategory
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thumbnail</th>
              <th>Subcategory</th>
              <th>Parent Category</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subcategories.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.id}</td>
                <td>
                  <div className="table-img-placeholder">{sub.icon}</div>
                </td>
                <td>
                  <strong>{sub.name}</strong>
                </td>
                <td>{sub.parent}</td>
                <td>{sub.slug}</td>
                <td>
                  <span className={`badge ${sub.status === "Active" ? "badge-success" : "badge-error"}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="text-right">
                  <button className="btn btn-outline btn-xs" style={{ marginRight: "4px" }}>Edit</button>
                  <button
                    className={`btn btn-outline btn-xs ${sub.status === "Active" ? "text-danger" : "text-success"}`}
                    onClick={() => handleToggleStatus(sub.id)}
                  >
                    {sub.status === "Active" ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subcategory">
        <form onSubmit={handleAddSubcategory}>
          <div className="form-group">
            <label>Parent Category</label>
            <select value={parentCat} onChange={(e) => setParentCat(e.target.value)} required>
              <option value="">Select Category</option>
              <option value="Vegetables & Fruits">Vegetables & Fruits</option>
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
            </select>
          </div>
          <div className="form-group">
            <label>Subcategory Name</label>
            <input
              type="text"
              placeholder="e.g. Fresh Fruits"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" accept="image/*" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Subcategory
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
