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
     * Expected sessionStorage structure:
     * sessionStorage.setItem("user", JSON.stringify({
     *   id,
     *   session_id,
     *   role,
     *   name
     * }))
     */
    const user = JSON.parse(sessionStorage.getItem("user"));

    if (user?.id && user?.session_id) {
      config.headers["x-user-id"] = user.id;
      config.headers["x-session-id"] = user.session_id;
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
    if (error.response?.status === 401) {
      // Prevent infinite loops
      if (window.location.pathname !== "/") {
        sessionStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
