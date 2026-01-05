import axios from "axios";

const BASE_URL = 'http://localhost:5000'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});


axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // assuming you save JWT here
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;