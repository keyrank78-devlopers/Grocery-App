import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";

export default function ProductDetailView({ product, onCancel, onEdit }) {
  // State to track which image is currently selected for preview
  const [activeImage, setActiveImage] = useState(product.image?.url || "");

  // Combine main image and additional images for the gallery list
  const galleryImages = [
    ...(product.image?.url ? [{ url: product.image.url, public_id: product.image.public_id }] : []),
    ...(product.images || []),
  ];

  // Calculate discount percentage
  const discount =
    product.mrp && product.sellPrice && product.mrp > 0
      ? (((product.mrp - product.sellPrice) / product.mrp) * 100).toFixed(0)
      : null;

  return (
    <div className="content-section active product-detail-page">
      {/* Dynamic Styling for Premium Aesthetics */}
      <style>{`
        .product-detail-page {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          border-bottom: 1px solid #eef2f6;
          padding-bottom: 16px;
        }
        .detail-layout {
          display: grid;
          grid-template-columns: 4.5fr 7.5fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        @media (max-width: 992px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* Media Section */
        .media-gallery {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .main-preview-container {
          position: relative;
          background: #fafafa;
          border: 1px solid #eef2f6;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          transition: transform 0.3s ease;
        }
        .main-preview-container:hover {
          transform: scale(1.01);
        }
        .main-preview-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .thumbnail-strip {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .thumb-btn {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          border: 2px solid transparent;
          overflow: hidden;
          background: #fdfdfd;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .thumb-btn.active {
          border-color: #0d6efd;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.15);
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* Specs / Details Section */
        .info-card {
          padding: 32px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #eef2f6;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sku-badge-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sku-tag {
          font-family: monospace;
          background: #f1f5f9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        .category-breadcrumb {
          font-size: 13px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cat-tag {
          font-weight: 600;
          color: #0d6efd;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .subcat-tag {
          font-weight: 500;
          color: #4f46e5;
          background: #eef2ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .product-title {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.25;
          margin: 0;
        }

        /* Glassmorphic Pricing Container */
        .pricing-box {
          background: linear-gradient(135deg, rgba(240, 253, 244, 0.8) 0%, rgba(240, 249, 255, 0.8) 100%);
          border: 1px solid rgba(187, 247, 208, 0.6);
          border-radius: 16px;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          box-shadow: 0 4px 15px rgba(22, 101, 52, 0.02);
        }
        .price-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .price-value-sell {
          font-size: 26px;
          font-weight: 800;
          color: #15803d;
        }
        .price-value-mrp {
          font-size: 18px;
          text-decoration: line-through;
          color: #94a3b8;
          font-weight: 500;
        }
        .discount-pill {
          background: #22c55e;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 4px;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-card {
          border: 1px solid #eef2f6;
          padding: 16px;
          border-radius: 12px;
          background: #fafafa;
        }
        .stat-card h4 {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #334155;
        }

        /* Variant chips */
        .variants-section {
          border-top: 1px solid #eef2f6;
          padding-top: 20px;
        }
        .variants-title {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 12px;
        }
        .variant-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .variant-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .variant-chip span {
          color: #64748b;
          font-weight: 400;
        }

        /* Video Showcase */
        .video-box {
          border: 1px solid #eef2f6;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 16/9;
          width: 100%;
        }

        /* Description Box */
        .description-card {
          background: #ffffff;
          border: 1px solid #eef2f6;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }
        .description-card .section-title {
          margin-bottom: 20px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Area */}
      <div className="detail-header">
        <div className="page-header-content">
          <h2>Product Details</h2>

        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            ← Back to List
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onEdit(product)}>
            Edit Product
          </button>
        </div>
      </div>

      <div className="detail-layout">
        {/* Left Side — Gallery and Video */}
        <div className="media-gallery">
          {/* Main Large Image Preview */}
          <div className="main-preview-container">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="main-preview-img" />
            ) : (
              <div style={{ fontSize: "64px" }}>📦</div>
            )}
          </div>

          {/* Small Thumbnails strip */}
          {galleryImages.length > 1 && (
            <div className="thumbnail-strip">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumb-btn ${activeImage === img.url ? "active" : ""}`}
                  onClick={() => setActiveImage(img.url)}
                >
                  <img src={img.url} alt={`preview-thumb-${idx}`} className="thumb-img" />
                </button>
              ))}
            </div>
          )}

          {/* Product Video Section if present */}
          {product.video?.url && (
            <div style={{ marginTop: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#334155", marginBottom: "10px" }}>Product Video Demonstration</h4>
              <div className="video-box">
                <video src={product.video.url} controls style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Side — Specs & Pricing Info */}
        <div className="info-card">
          {/* Category & Status breadcrumbs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div className="category-breadcrumb">
              Catalog <span style={{ color: "#cbd5e1" }}>/</span>
              <span className="cat-tag">{product.category?.name || "Uncategorized"}</span>
              {product.subCategory?.name && (
                <>
                  <span style={{ color: "#cbd5e1" }}>/</span>
                  <span className="subcat-tag">{product.subCategory.name}</span>
                </>
              )}
            </div>

            <span className={`badge ${product.isActive ? "badge-success" : "badge-error"}`}>
              {product.isActive ? "Active in Store" : "Inactive"}
            </span>
          </div>

          {/* Product Name */}
          <div>
            <h1 className="product-title">{product.name}</h1>

            {/* SKU & ID Tag */}
            <div className="sku-badge-container" style={{ marginTop: "12px" }}>
              <span>SKU: <span className="sku-tag">{product.sku}</span></span>
              <span style={{ color: "#cbd5e1" }}>|</span>
              <span className="text-muted text-sm">Created: {new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Premium Pricing Panel */}
          <div className="pricing-box">
            <div>
              <div className="price-label">Selling Price</div>
              <div className="price-value-sell">₹{parseFloat(product.sellPrice || 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="price-label">Maximum Retail Price (MRP)</div>
              <div className="price-value-mrp">₹{parseFloat(product.mrp || 0).toFixed(2)}</div>
              {discount && discount > 0 && (
                <div className="discount-pill">{discount}% OFF</div>
              )}
            </div>
          </div>

          {/* Stock & GST Information */}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Stock Status</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <span className={`stat-value ${product.stockQuantity > 0 ? "text-success" : "text-danger"}`}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} Units` : "Out of Stock"}
                </span>
                <span className={`status-indicator ${product.stockQuantity > 0 ? "in-stock" : "out-of-stock"}`} />
              </div>
            </div>


          </div>

          {/* Variants chips section */}
          {product.variants && product.variants.length > 0 && (
            <div className="variants-section">
              <h3 className="variants-title">Available Variants</h3>
              <div className="variant-chips">
                {product.variants.map((v, idx) => (
                  <div key={idx} className="variant-chip">
                    <span>{v.key}:</span> {v.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description Section (Rich Markdown preview) */}
      <div className="card description-card">
        <h3 className="section-title">Product Specifications & Description</h3>
        {product.description ? (
          <div data-color-mode="light" style={{ padding: "8px 0" }}>
            <MDEditor.Markdown source={product.description} style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-sans, inherit)" }} />
          </div>
        ) : (
          <p className="text-muted" style={{ fontStyle: "italic" }}>No description provided for this product.</p>
        )}
      </div>
    </div>
  );
}
