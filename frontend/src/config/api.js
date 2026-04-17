// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://crimsons-study-squad.up.railway.app'
    : 'http://localhost:5000');

export default API_BASE_URL;
