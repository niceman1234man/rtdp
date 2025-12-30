import axios from "axios";

const BASE_URL = "https://rtdp.onrender.com";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
 // Enable credentials for cross-origin requests
});

// Attach Authorization header from localStorage if present
axiosInstance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default axiosInstance;