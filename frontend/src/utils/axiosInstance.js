import axios from "axios";

const BASE_URL = "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  // do not set Content-Type here — let axios set it (important for FormData uploads)
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;