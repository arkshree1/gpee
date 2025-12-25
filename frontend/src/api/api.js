import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = async (formData) => {
  return apiClient.post('/api/auth/signup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const verifyOtp = async (payload) => {
  return apiClient.post('/api/auth/verify-otp', payload);
};

export const login = async (payload) => {
  return apiClient.post('/api/auth/login', payload);
};

export const forgotPassword = async (payload) => {
  return apiClient.post('/api/auth/forgot-password', payload);
};

export const resetPassword = async (payload) => {
  return apiClient.post('/api/auth/reset-password', payload);
};

// Student APIs
export const getStudentStatus = async () => apiClient.get('/api/student/status');
export const applyGate = async (payload) => apiClient.post('/api/student/apply', payload);
export const cancelGate = async () => apiClient.post('/api/student/cancel');
export const createLocalGatepass = async (payload) => apiClient.post('/api/student/local-gatepass', payload);
export const createOutstationGatepass = async (payload) =>
  apiClient.post('/api/student/outstation-gatepass', payload);
export const getStudentLogs = async () => apiClient.get('/api/student/logs');
export const getMyGatepasses = async () => apiClient.get('/api/student/my-gatepasses');
export const applyGatepassExit = async (payload) => apiClient.post('/api/student/gatepass-exit', payload);

// Guard APIs
export const getGuardDashboard = async () => apiClient.get('/api/guard/dashboard');
export const scanQrToken = async (payload) => apiClient.post('/api/guard/scan', payload);
export const decideRequest = async (payload) => apiClient.post('/api/guard/decide', payload);
export const getGuardEntryExitLogs = async () => apiClient.get('/api/guard/entry-exit-logs');
export const searchGuardStudents = async (q) =>
  apiClient.get('/api/guard/students', { params: { q } });
export const manualExit = async (payload) => apiClient.post('/api/guard/manual-exit', payload);
export const manualEntry = async (payload) => apiClient.post('/api/guard/manual-entry', payload);

// Admin APIs
export const getAdminOverview = async () => apiClient.get('/api/admin/overview');
export const getAdminLogs = async () => apiClient.get('/api/admin/logs');
export const getAdminUsers = async () => apiClient.get('/api/admin/users');

// Hostel Office APIs
export const getPendingGatepasses = async () => apiClient.get('/api/hostel-office/pending-gatepasses');
export const getGatepassHistory = async (search) =>
  apiClient.get('/api/hostel-office/gatepass-history', { params: { search } });
export const getEntryExitLogs = async (date, search) =>
  apiClient.get('/api/hostel-office/entry-exit-logs', { params: { date, search } });
export const decideGatepass = async (payload) => apiClient.post('/api/hostel-office/decide-gatepass', payload);

export default apiClient;
