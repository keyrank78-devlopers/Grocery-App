import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function NotificationView() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    imageFile: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, imageFile: file || null }));
      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      showToast("Title and message body are required", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to broadcast this notification to all users?")) {
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("body", formData.body);
      if (formData.imageFile) {
        submitData.append("image", formData.imageFile);
      }

      const res = await axios.post(`${BASE_URL}/admin/notifications/broadcast`, submitData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        showToast(res.data.message || "Notification sent successfully!", "success");
        setFormData({ title: "", body: "", imageFile: null });
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to send notification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-section active">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="page-header-content">
          <h2>Push Notifications</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Broadcast promotional messages and alerts to all registered mobile app customers.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        
        {/* ── Form Section ── */}
        <div style={{ flex: "2", minWidth: "300px", backgroundColor: "var(--bg-secondary)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", color: "var(--text-main)" }}>Compose Message</h3>
          
          <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Notification Title <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 🚀 Flash Sale is LIVE!"
                required
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", outline: "none", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Message Body <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={4}
                placeholder="e.g. Flat 50% off on all fresh vegetables today. Order now!"
                required
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", outline: "none", fontSize: "14px", resize: "vertical" }}
              ></textarea>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Banner Image (Optional)
              </label>
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", outline: "none", fontSize: "14px" }}
              />
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>Upload a banner image from your device.</p>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: "12px 24px", width: "auto" }}
              >
                {loading ? "Sending..." : "Send Broadcast"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Info & Preview Section ── */}
        <div style={{ flex: "1", minWidth: "280px", backgroundColor: "var(--bg-secondary)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border-color)", alignSelf: "flex-start" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text-main)" }}>How it works</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            <li style={{ display: "flex", gap: "8px" }}>
              <span>📌</span>
              <span>This will send a push notification to <b>all customers</b> who have logged into the mobile app at least once.</span>
            </li>
            <li style={{ display: "flex", gap: "8px" }}>
              <span>📱</span>
              <span>The notification will appear on their device lock screen and notification drawer.</span>
            </li>
            <li style={{ display: "flex", gap: "8px" }}>
              <span>⚡</span>
              <span>Delivery is instant. Avoid sending too many notifications in a short time to prevent spamming users.</span>
            </li>
          </ul>

          {(formData.title || formData.body) && (
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Live Preview</h4>
              
              <div style={{ backgroundColor: "var(--bg-primary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", gap: "12px", flexDirection: "column" }}>
                
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "40px", height: "40px", backgroundColor: "var(--primary-light)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" stroke="var(--primary)" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formData.title || "Notification Title"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {formData.body || "Message body will appear here..."}
                    </p>
                  </div>
                </div>

                {previewUrl && (
                  <div style={{ width: "100%", height: "120px", borderRadius: "8px", backgroundColor: "#e2e8f0", overflow: "hidden", marginTop: "8px" }}>
                    <img 
                      src={previewUrl} 
                      alt="preview" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      onError={(e) => e.target.style.display = 'none'} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
