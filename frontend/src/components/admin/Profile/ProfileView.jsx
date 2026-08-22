import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ProfileView() {
  const { user, token, login } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    mobile: "",
    role: "",
    avatarUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ── Fetch Profile ───────────────────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      if (response.data && response.data.success) {
        const u = response.data.data.user;
        setForm({
          id: u.id || "",
          name: u.name || "",
          email: u.email || "",
          mobile: u.mobile || "",
          role: u.role || "",
          avatarUrl: u.avatarUrl || "",
        });
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load profile details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size must be less than 2MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/profile/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data && response.data.success) {
        const updatedUser = response.data.data.user;
        setForm((prev) => ({ ...prev, avatarUrl: updatedUser.avatarUrl }));
        login(updatedUser, token);
        showToast("Profile image updated successfully!", "success");
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to upload profile image";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  // ── Save Profile ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/auth/profile`,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
        },
        { withCredentials: true }
      );

      const updatedUser = response.data.data.user;
      
      // Update global context so sidebar updates instantly
      login(updatedUser, token);
      
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update profile";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="content-section active">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            <div style={{
              width: "36px", height: "36px", border: "3px solid #dee2e6",
              borderTopColor: "#0d6efd", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
            }} />
            <p style={{ fontSize: "14px" }}>Loading profile details...</p>
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
          <h2>My Profile</h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* Left Side: Avatar Card */}
        <div className="card" style={{ flex: "1", minWidth: "280px", textAlign: "center", padding: "40px 24px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <style>{`
            .avatar-upload-container:hover .avatar-hover-overlay {
              opacity: 1 !important;
            }
          `}</style>
          <div 
            className="avatar-upload-container"
            onClick={() => document.getElementById("avatar-upload-input").click()}
            style={{
              width: "96px", height: "96px", borderRadius: "50%",
              background: form.avatarUrl ? `url(${form.avatarUrl}) center/cover no-repeat` : "linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", fontWeight: "bold", margin: "0 auto 12px",
              border: "4px solid #fff",
              boxShadow: "0 0 0 1px var(--border-color), var(--shadow-md)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            title="Click to change profile picture"
          >
            {!form.avatarUrl && getInitials(form.name)}
            
            {/* Hover overlay */}
            <div 
              className="avatar-hover-overlay"
              style={{
                position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.2s", color: "#fff"
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
            disabled={uploading}
          />

          {uploading ? (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "16px", fontWeight: "600" }}>Uploading...</span>
          ) : (
            <button 
              type="button" 
              onClick={() => document.getElementById("avatar-upload-input").click()}
              className="btn btn-ghost btn-xs" 
              style={{ color: "var(--primary)", fontWeight: "700", marginBottom: "16px" }}
            >
              Change Photo
            </button>
          )}

          <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "-0.02em" }}>{form.name}</h3>
          <span className="badge" style={{
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            borderColor: "var(--primary-muted)",
            border: "1px solid",
            textTransform: "uppercase",
            fontSize: "10.5px",
            fontWeight: "700",
            padding: "5px 12px",
            borderRadius: "12px",
            letterSpacing: "0.04em"
          }}>
            {form.role === "admin" ? "Super Admin" : "Staff Member"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Admin ID</span>
              <span style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "600", fontFamily: "monospace" }}>{form.id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Registered Role</span>
              <span style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "600", textTransform: "capitalize" }}>{form.role.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="card" style={{ flex: "2", minWidth: "320px", padding: "32px 40px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-main)", letterSpacing: "-0.02em" }}>Account Details</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Update your personal profile information and contact details.</p>
          </div>
          
          <form onSubmit={handleSubmit}>

            <div className="form-group" style={{ marginBottom: "22px" }}>
              <label htmlFor="profile-name" style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Full Name *</label>
              <input
                id="profile-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "22px" }}>
              <div className="form-group">
                <label htmlFor="profile-email" style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Email Address *</label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-mobile" style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Mobile Number *</label>
                <input
                  id="profile-mobile"
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: "150px", height: "42px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
