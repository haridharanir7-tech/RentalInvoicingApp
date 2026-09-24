import axios from 'axios';

const API_BASE_URL = '/api/priya';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rental_app_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle auth expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('rental_app_token');
      localStorage.removeItem('rental_app_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/login', credentials),
  forgotPassword: (email) => api.post('/forgot-password', { email }),
  resetPassword: (payload) => api.post('/reset-password', payload),
  getMe: () => api.get('/me')
};

export const userApi = {
  listUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUserStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  getLandlords: () => api.get('/landlords')
};

export const adminLandlordApi = {
  getLandlords: () => api.get('/admin/landlords'),
  updateStatus: (id, status) => api.put(`/admin/landlords/${id}/status`, { status }),
  createAccess: (id, payload) => api.post(`/admin/landlords/${id}/create-access`, payload)
};

export const dashboardApi = {
  getSummary: (period) => api.get('/dashboard/summary', { params: { period } }),
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getLandlordDashboard: () => api.get('/dashboard/landlord')
};

export const auditApi = {
  getMasterDataLogs: (params) => api.get('/audit/master-data', { params }),
  getInvoiceOverrides: () => api.get('/audit/invoice-overrides'),
  recordInvoiceOverride: (payload) => api.post('/audit/invoice-override', payload)
};

export const backupApi = {
  createBackup: () => api.post('/backup/create'),
  listBackups: () => api.get('/backup/list'),
  downloadUrl: (filename) => `${API_BASE_URL}/backup/download/${filename}`,
  testRestore: (id) => api.post(`/backup/test-restore/${id}`)
};

export const reportApi = {
  getInvoiceRegister: (params) => api.get('/reports/invoice-register', { params }),
  getExportCsvUrl: (params) => {
    const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
    return `${API_BASE_URL}/reports/invoice-register?${query}`;
  }
};

export default api;

