// src/api/api.js
import axios from "axios";

const API_BASE =
  import.meta?.env?.VITE_API_BASE ||
  "https://apis.allsoft.co/api/documentManagement"; // fallback

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dms_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("dms_token");
      // optional: window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
