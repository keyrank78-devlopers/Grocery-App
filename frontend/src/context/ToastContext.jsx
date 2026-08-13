import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  let timeoutId = null;

  const showToast = useCallback((message, type = "success") => {
    // Clear any existing timeouts to prevent overlapping hides
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    setToast({ show: true, message, type });

    timeoutId = setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: "", type: "success" });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Global Toast Render */}
      {toast.show && (
        <div className={`toast-message toast-${toast.type}`} onClick={hideToast} style={{ cursor: "pointer" }}>
          {toast.type === "success" ? (
            <svg style={{ width: "16px", height: "16px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ) : (
            <svg style={{ width: "16px", height: "16px", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
