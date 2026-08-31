import React, { useEffect, useState } from "react";
import axios from "axios";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EditProduct({ product, onCancel, onSuccess }) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: product.name || "",
    category: product.category?._id || product.category || "",
    subCategory: product.subCategory?._id || product.subCategory || "",
    mrp: product.mrp !== undefined ? product.mrp : "",
    sellPrice: product.sellPrice !== undefined ? product.sellPrice : "",
    gstRate: product.gstRate !== undefined ? product.gstRate : "",
  });

  const [description, setDescription] = useState(product.description || "");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);

  // ── Media existing vs new ───────────────────────────────────────
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [otherImages, setOtherImages] = useState([]);
  const [otherPreviews, setOtherPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(product.images || []);
  const [video, setVideo] = useState(null);
  const [videoName, setVideoName] = useState("");

  // ── Variants ───────────────────────────────────────────────────
  const [variants, setVariants] = useState(
    product.variants && product.variants.length > 0
      ? product.variants.map(v => ({ key: v.key || "", value: v.value || "" }))
      : [{ key: "", value: "" }]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          axios.get(`${BASE_URL}/admin/get-categories`, { withCredentials: true }),
          axios.get(`${BASE_URL}/admin/get-sub-categories`, { withCredentials: true }),
        ]);
        setCategories(catRes.data.data?.filter((c) => c.isActive) || []);
        const fetchedSubs = subRes.data.data?.filter((s) => s.isActive) || [];
        setSubCategories(fetchedSubs);

        // Filter subcategories for the initial category
        const initialCategory = product.category?._id || product.category;
        if (initialCategory) {
          const filtered = fetchedSubs.filter(
            (s) => s.category?._id === initialCategory || s.category === initialCategory
          );
          setFilteredSubs(filtered);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load categories", "error");
      }
    };
    fetchDropdowns();
  }, [product]);

  // Filter subcategories on category change
  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    setForm((prev) => ({ ...prev, category: selectedCat, subCategory: "" }));
    if (!selectedCat) {
      setFilteredSubs([]);
      return;
    }
    const filtered = subCategories.filter(
      (s) => s.category?._id === selectedCat || s.category === selectedCat
    );
    setFilteredSubs(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleOtherImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setOtherImages(files);
    setOtherPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeOtherImage = (idx) => {
    setOtherImages((prev) => prev.filter((_, i) => i !== idx));
    setOtherPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Variant handlers
  const handleVariantChange = (idx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeVariant = (idx) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit edits
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (parseFloat(form.sellPrice) > parseFloat(form.mrp)) {
      showToast("Selling price cannot be greater than MRP", "error");
      return;
    }

    const validVariants = variants.filter((v) => v.key.trim() && v.value.trim());

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", description || "");
      formData.append("category", form.category);
      formData.append("subCategory", form.subCategory);
      formData.append("mrp", form.mrp);
      formData.append("sellPrice", form.sellPrice);
      formData.append("gstRate", form.gstRate !== "" ? form.gstRate : "0");

      if (mainImage) {
        formData.append("image", mainImage);
      }
      if (otherImages.length > 0) {
        otherImages.forEach((img) => formData.append("images", img));
      }
      formData.append("remainingImages", JSON.stringify(existingImages));
      if (video) {
        formData.append("video", video);
      }

      formData.append("variants", JSON.stringify(validVariants));

      const res = await axios.put(`${BASE_URL}/admin/update-products/${product.sku}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Product updated successfully!", "success");
      onSuccess(res.data.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount =
    form.mrp && form.sellPrice && parseFloat(form.mrp) > 0
      ? (((parseFloat(form.mrp) - parseFloat(form.sellPrice)) / parseFloat(form.mrp)) * 100).toFixed(1)
      : null;

  return (
    <div className="content-section active">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h2>Edit Product: {product.name}</h2>

        </div>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Row 1: Basic Info + Pricing */}
        <div className="staff-form-grid" style={{ marginBottom: "24px" }}>

          {/* Left — Basic Info */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 className="section-title">Basic Information</h3>

            <div className="form-group">
              <label>Product Name <span className="text-danger">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label>Category <span className="text-danger">*</span></label>
                  <select name="category" value={form.category} onChange={handleCategoryChange} required>
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-6">
                <div className="form-group">
                  <label>Sub-Category <span className="text-danger">*</span></label>
                  <select name="subCategory" value={form.subCategory} onChange={handleChange} required disabled={!form.category}>
                    <option value="">
                      {!form.category
                        ? "Select category first"
                        : filteredSubs.length === 0
                          ? "No sub-categories available"
                          : "Select Sub-Category"}
                    </option>
                    {filteredSubs.map((sub) => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Pricing & Stock */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 className="section-title">Pricing & Stock</h3>

            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label>MRP (₹) <span className="text-danger">*</span></label>
                  <input type="number" name="mrp" value={form.mrp} onChange={handleChange} min="0" step="0.01" required />
                </div>
              </div>

              <div className="col-6">
                <div className="form-group">
                  <label>Selling Price (₹) <span className="text-danger">*</span></label>
                  <input type="number" name="sellPrice" value={form.sellPrice} onChange={handleChange} min="0" step="0.01" required />
                  {form.mrp && form.sellPrice && parseFloat(form.sellPrice) > parseFloat(form.mrp) && (
                    <span style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      ⚠ Selling price cannot be greater than MRP
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <div className="form-group">
                  <label>GST Rate (%)</label>
                  <input type="number" name="gstRate" value={form.gstRate} onChange={handleChange} min="0" max="100" step="0.01" />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {discount !== null && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px", marginTop: "8px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#166534", marginBottom: "8px" }}>Price Summary</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: "#6c757d" }}>MRP</span>
                  <span style={{ textDecoration: "line-through", color: "#6c757d" }}>₹{parseFloat(form.mrp).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: "#6c757d" }}>Sell Price</span>
                  <span style={{ fontWeight: 600 }}>₹{parseFloat(form.sellPrice).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a", fontWeight: 700, borderTop: "1px solid #bbf7d0", paddingTop: "6px" }}>
                  <span>Customer Saves</span>
                  <span>{discount}% OFF</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Description */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "16px" }}>Product Description</h3>
          <div data-color-mode="light">
            <MDEditor
              value={description}
              onChange={setDescription}
              height={320}
              visibleDragbar={false}
              preview="edit"
              commands={[
                commands.bold,
                commands.italic,
                commands.strikethrough,
                commands.hr,
                commands.divider,
                commands.title1,
                commands.title2,
                commands.title3,
                commands.divider,
                commands.unorderedListCommand,
                commands.orderedListCommand,
                commands.checkedListCommand,
                commands.divider,
                commands.quote,
                commands.code,
                commands.codeBlock,
                commands.divider,
                commands.link,
                commands.image,
                commands.table,
              ]}
              extraCommands={[
                commands.codePreview,
                commands.livePreview,
                commands.fullscreen,
              ]}
            />
          </div>
        </div>

        {/* Row 3: Images & Video */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "16px" }}>Product Images & Video</h3>

          <div className="staff-form-grid">
            {/* Main Image */}
            <div>
              <div className="form-group">
                <label>Main Image</label>
                <input type="file" accept="image/*" onChange={handleMainImage} />
                <p className="text-muted text-sm" style={{ marginTop: "4px" }}>Leave empty to keep existing image</p>
              </div>

              {/* Image Previews */}
              {mainImagePreview ? (
                <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
                  <img src={mainImagePreview} alt="new main preview"
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "2px solid #0d6efd" }} />
                  <button type="button"
                    onClick={() => { setMainImage(null); setMainImagePreview(null); }}
                    style={{ position: "absolute", top: "-8px", right: "-8px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "14px", lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ) : product.image?.url ? (
                <div style={{ marginTop: "8px" }}>
                  <p className="text-sm" style={{ marginBottom: "4px", color: "#6c757d" }}>Current Main Image:</p>
                  <img src={product.image.url} alt="current main"
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", border: "1px solid #dee2e6" }} />
                </div>
              ) : null}
            </div>

            {/* Other Images */}
            <div>
              <div className="form-group">
                <label>Additional Images (max 4)</label>
                <input type="file" accept="image/*" multiple onChange={handleOtherImages} />
                <p className="text-muted text-sm" style={{ marginTop: "4px" }}>Uploading new additional images will append them to the existing ones</p>
              </div>

              {existingImages && existingImages.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <p className="text-sm" style={{ marginBottom: "4px", color: "#6c757d" }}>Current Additional Images:</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {existingImages.map((img, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={img.url} alt={`current-other-${idx}`}
                          style={{ width: "80px", height: "80px", borderRadius: "6px", objectFit: "cover", border: "1px solid #dee2e6" }} />
                        <button type="button"
                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: "absolute", top: "-7px", right: "-7px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "13px", lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {otherPreviews.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <p className="text-sm" style={{ marginBottom: "4px", color: "#6c757d" }}>New Upload Previews:</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {otherPreviews.map((src, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={src} alt={`other-${idx}`}
                          style={{ width: "80px", height: "80px", borderRadius: "6px", objectFit: "cover", border: "1px solid #dee2e6" }} />
                        <button type="button" onClick={() => removeOtherImage(idx)}
                          style={{ position: "absolute", top: "-7px", right: "-7px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "13px", lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video */}
          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>Product Video</label>
            <input type="file" accept="video/*" onChange={(e) => {
              const file = e.target.files[0];
              setVideo(file || null);
              setVideoName(file ? file.name : "");
            }} />
            <p className="text-muted text-sm" style={{ marginTop: "4px" }}>Leave empty to keep existing video</p>

            {videoName ? (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6c757d" }}>📹 New upload: {videoName}</span>
                <button type="button" onClick={() => { setVideo(null); setVideoName(""); }}
                  style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "13px" }}>
                  Remove
                </button>
              </div>
            ) : product.video?.url ? (
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6c757d" }}>📹 Current Video: </span>
                <a href={product.video.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#0d6efd", textDecoration: "underline" }}>
                  View Existing Video
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Row 4: Variants */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="section-title" style={{ marginBottom: "4px" }}>Product Variants</h3>
              <p className="text-muted text-sm">e.g. Weight → 500g, Color → Red, Size → Large</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={addVariant}>
              + Add Variant
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {variants.map((v, idx) => (
              <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <input type="text" placeholder="Key (e.g. Weight)" value={v.key}
                    onChange={(e) => handleVariantChange(idx, "key", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-color, #dee2e6)", borderRadius: "6px", fontSize: "14px" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="text" placeholder="Value (e.g. 500g)" value={v.value}
                    onChange={(e) => handleVariantChange(idx, "value", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border-color, #dee2e6)", borderRadius: "6px", fontSize: "14px" }} />
                </div>
                <button type="button" onClick={() => removeVariant(idx)}
                  disabled={variants.length === 1}
                  style={{ background: variants.length === 1 ? "#f8f9fa" : "#fff0f0", border: "1px solid", borderColor: variants.length === 1 ? "#dee2e6" : "#fca5a5", color: variants.length === 1 ? "#adb5bd" : "#dc3545", borderRadius: "6px", padding: "8px 12px", cursor: variants.length === 1 ? "not-allowed" : "pointer", fontWeight: 500, fontSize: "13px" }}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          {variants.some(v => v.key || v.value) && (
            <div style={{ marginTop: "16px", background: "#f8f9fa", borderRadius: "8px", padding: "12px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#6c757d", marginBottom: "8px" }}>Preview</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {variants.filter(v => v.key && v.value).map((v, idx) => (
                  <span key={idx} style={{ background: "#e9ecef", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500 }}>
                    {v.key}: {v.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingBottom: "32px" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: "140px" }}>
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
