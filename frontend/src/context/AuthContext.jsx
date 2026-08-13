import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";

// Enable credentials for Axios globally so that cookies are sent automatically with every request
axios.defaults.withCredentials = true;

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ref to avoid multiple simultaneous refresh calls
  const isRefreshing = useRef(false);
  const failedQueue = useRef([]);

  // Process queued requests after refresh
  const processQueue = (error) => {
    failedQueue.current.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    failedQueue.current = [];
  };

  // ── Axios Interceptor — Auto Refresh Token ──────────────────────────
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,

      async (error) => {
        const originalRequest = error.config;

        // Ignore refresh-token and logout endpoints to avoid infinite loop
        const isAuthEndpoint =
          originalRequest.url?.includes("/auth/refresh-token") ||
          originalRequest.url?.includes("/auth/logout") ||
          originalRequest.url?.includes("/auth/me");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          
          // If already refreshing, queue this request
          if (isRefreshing.current) {
            return new Promise((resolve, reject) => {
              failedQueue.current.push({ resolve, reject });
            })
              .then(() => axios(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            // Call refresh-token API — cookie automatically sent
            await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });

            // New access token is now set in cookie by backend
            processQueue(null);

            // Retry the original failed request
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh token bhi expire ho gaya → force logout
            processQueue(refreshError);
            setUser(null);
            setToken(null);
            setIsLoggedIn(false);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ── Check Active Session on Page Load ──────────────────────────────
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/auth/me`);
        if (response.data && response.data.success) {
          const userData = response.data.data.user;
          setUser(userData);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.log("Session verification: No active session cookie found.");
      } finally {
        setLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      await axios.post(`${BASE_URL}/auth/logout`);
    } catch (err) {
      console.error("Logout API Error:", err);
    } finally {
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "36px",
            height: "36px",
            border: "3px solid #dee2e6",
            borderTopColor: "#0d6efd",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <span style={{ fontSize: "13px", color: "#6c757d", fontWeight: 500 }}>Connecting to Control Center...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
