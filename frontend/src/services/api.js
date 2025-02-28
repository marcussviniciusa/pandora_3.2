import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || 'Um erro inesperado ocorreu';
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        toast.error('Sessão expirada, faça login novamente');
      }
    } else if (error.response?.status === 403) {
      toast.error('Você não tem permissão para realizar esta ação');
    } else if (error.response?.status === 500) {
      toast.error('Erro no servidor, tente novamente mais tarde');
    } else if (error.response?.status === 404) {
      toast.error('Recurso não encontrado');
    } else if (!error.response) {
      toast.error('Não foi possível conectar ao servidor');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
