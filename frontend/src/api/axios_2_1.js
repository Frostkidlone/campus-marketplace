
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(config => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use(res=>res, err=>{ if (err.response?.status===401){ localStorage.removeItem('token'); localStorage.removeItem('user'); if (window.location.pathname!=='/login') window.location.href='/login'; } return Promise.reject(err); });
export default api;
export const getImageUrl = (path) => { if (!path) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800'; if (path.startsWith('http')) return path; const base = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'; return `${base}${path}`; };
