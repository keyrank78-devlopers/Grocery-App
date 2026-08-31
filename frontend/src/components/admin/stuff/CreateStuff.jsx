import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../../../context/ToastContext";
import PermissionsMatrix from "./PermissionsMatrix";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CreateStuff({ onCancel, onSuccess }) {
    const { showToast } = useToast();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        landmark: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [permissions, setPermissions] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Validation checks
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.role) {
            showToast("Please fill in all personal details", "error");
            return;
        }
        if (!form.street.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
            showToast("Please fill in the required address fields", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const url = `${BASE_URL}/admin/create-staff`;
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
            };
            const data = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
                role: form.role,
                address: {
                    street: form.street.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                    landmark: form.landmark.trim()
                },
                permissions
            };

            const response = await axios.post(url, data, config);

            showToast("Staff member created successfully!", "success");
            console.log("Response of created stuff api", response);
            if (onSuccess) {
                onSuccess(response.data?.data);
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to create staff member.";
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-staff-container">
            <div className="page-header">
                <div className="page-header-content">
                    <h2>Add New Staff Member</h2>

                </div>
                <button type="button" className="btn btn-outline" onClick={onCancel}>
                    ← Back to List
                </button>
            </div>

            <div className="card" style={{ padding: "28px 32px" }}>
                <form onSubmit={handleSubmit} className="staff-form">
                    <div className="staff-form-grid">

                        {/* Left Side: Personal Details */}
                        <div className="form-section">
                            <h3 className="section-title">Personal Information</h3>

                            <div className="form-group">
                                <label>Full Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ravi Verma"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="e.g. ravi@gmail.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number <span className="text-danger">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. 4555543443"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Staff Role <span className="text-danger">*</span></label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    <option value="sub_admin">Sub Admin</option>
                                    <option value="warehouse_manager">Warehouse Manager</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="agent">Delivery/Support Agent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Password <span className="text-danger">*</span></label>
                                <div className="password-input-wrapper" style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
                                        style={{ paddingRight: "40px", width: "100%" }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle-btn"
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "0",
                                            color: "#6c757d"
                                        }}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Address Details */}
                        <div className="form-section">
                            <h3 className="section-title">Address Information</h3>

                            <div className="form-group">
                                <label>Street Address <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="street"
                                    value={form.street}
                                    onChange={handleChange}
                                    placeholder="e.g. 123, MG Road"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>City <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="e.g. Bengaluru"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>State <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Karnataka"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Pincode <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={form.pincode}
                                    onChange={handleChange}
                                    placeholder="e.g. 560001"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Landmark (Optional)</label>
                                <input
                                    type="text"
                                    name="landmark"
                                    value={form.landmark}
                                    onChange={handleChange}
                                    placeholder="e.g. Near Post Office"
                                />
                            </div>
                        </div>

                    </div>
                    
                    {/* Full Width: Permissions Matrix */}
                    <div style={{ marginTop: "20px" }}>
                        <PermissionsMatrix permissions={permissions} setPermissions={setPermissions} />
                    </div>

                    <div className="form-actions" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Member"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
