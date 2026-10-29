import axios from 'axios';

// Si existe VITE_API_BASE_URL se usa, sino en desarrollo usa localhost:5236 y en producción ruta relativa
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5236' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
