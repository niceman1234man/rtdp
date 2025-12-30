import axios from "axios";

const BASE_URL = "https://rtdp.onrender.com";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  // Do not set a global Content-Type so multipart/form-data requests can let the browser set boundaries
});

// Ensure FormData requests don't carry a JSON content-type header
axiosInstance.interceptors.request.use((config) => {
  try {
    // remove Content-Type if body is FormData so browser sets correct multipart boundary
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) delete config.headers['Content-Type'];
    }
  } catch (e) {
    // ignore
  }
  return config;
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