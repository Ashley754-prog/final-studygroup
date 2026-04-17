// API Helper for consistent API URL usage
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export const axiosConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
};

export default API_BASE_URL;
