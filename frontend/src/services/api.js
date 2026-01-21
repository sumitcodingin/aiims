import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================
   ATTACH SESSION HEADERS ON LOAD
========================================= */

const sessionId = sessionStorage.getItem("sessionId");
const userId = sessionStorage.getItem("userId");

if (sessionId && userId) {
  api.defaults.headers.common["x-session-id"] = sessionId;
  api.defaults.headers.common["x-user-id"] = userId;
}

/* =========================================
   GLOBAL 401 AUTO-LOGOUT INTERCEPTOR
========================================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired / invalid (logged in elsewhere)
      sessionStorage.clear();

      // Optional alert (you can remove if unwanted)
      alert("Your session has expired. Please login again.");

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
