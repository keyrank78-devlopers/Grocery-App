import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/image/Keyrank-Logo.png";
import loginBg from "../assets/image/login_background.png";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const { login } = useAuth();

  // login api start-----------------------
  const LoginApi = async () => {
    try {
      const url = `${BASE_URL}/auth/login`;
      const config = {
        headers: {
          "Content-Type": "application/json",
        }
      };
      const data = { email, password };

      const response = await axios.post(url, data, config);

      console.log(response.data);

      // Handle successful login
      showToast("Sign in successful! Redirecting...", "success");

      // Extract user details and accessToken/refreshToken from response
      const responseData = response.data?.data || {};
      const userData = responseData.user || null;
      const accessToken = responseData.accessToken || null;
      const refreshToken = responseData.refreshToken || null;

      setTimeout(() => {
        // Save to in-memory React Context and localStorage
        login(userData, accessToken, refreshToken);
      }, 1500);
    }
    catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to log in. Please check your credentials.";
      showToast(errorMsg, "error");
    }
  }


  // end ---------------------



  const handleSubmit = (e) => {
    e.preventDefault();
    LoginApi();


  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Mock Reset Password link sent to: " + (email || "your email"));
  };

  return (
    <>
      <div className="login-container">
        <div className="login-image-side" style={{ backgroundImage: `url(${loginBg})` }}>
          <div className="login-image-overlay"></div>
          <div className="overlay-content">
            <div className="overlay-badge">Enterprise Admin Panel</div>
            <h1 className="overlay-title">Manage your store with confidence</h1>
            <p className="overlay-desc">
              A powerful control center for inventory, orders, staff, and analytics — built for scale.
            </p>
            <div className="overlay-features">
              <div className="overlay-feature">
                <div className="overlay-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                Role-based access control
              </div>
              <div className="overlay-feature">
                <div className="overlay-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                Real-time order tracking
              </div>
              <div className="overlay-feature">
                <div className="overlay-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                Advanced analytics dashboard
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Clean login form */}
        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <img src={logo} alt="Keyrank Logo" className="login-logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <h2>Sign In</h2>
              <p>Access your store dashboard control panel</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. admin@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                  <a href="#" onClick={handleForgotPassword} className="forgot-password-link">
                    Forgot Password?
                  </a>
                </div>
                <div className="password-input-wrapper" style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                      </svg>
                    ) : (
                      <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn">
                Sign In
              </button>
            </form>

            <div className="login-form-footer">
              <p>&copy; {new Date().getFullYear()} Keyrank. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
