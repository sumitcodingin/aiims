import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================
   ATTACH SESSION HEADERS ON EVERY REQUEST
========================================= */
api.interceptors.request.use(
  (config) => {
    /**
     * Retrieve User Data
     * We try to be flexible here because authController sends 'sessionId' (camelCase)
     * but some parts of the app might expect 'session_id' (snake_case).
     */
    let user = null;
    try {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error("Failed to parse user session:", error);
      sessionStorage.removeItem("user"); // Clear corrupted data
    }

    if (user) {
      // 1. Resolve User ID (backend sends 'id', some DBs use 'user_id')
      const userId = user.id || user.user_id;

      // 2. Resolve Session ID (backend sends 'sessionId', others might use 'session_id')
      const sessionId = user.sessionId || user.session_id;

      // 3. Attach headers if both exist
      if (userId && sessionId) {
        config.headers["x-user-id"] = userId;
        config.headers["x-session-id"] = sessionId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================
   GLOBAL 401 AUTO-LOGOUT (SAFE)
========================================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      
      // Check if we are already on the login page to avoid loops
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        console.warn("Session expired. Logging out...");
        
        // Clear local session data
        sessionStorage.removeItem("user");
        
        // Optional: Alert the user
        // alert("Your session has expired. Please login again.");
        
        // Redirect to login
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;