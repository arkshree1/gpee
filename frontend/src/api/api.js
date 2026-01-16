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
export const applyGatepassEntry = async (payload) => apiClient.post('/api/student/gatepass-entry', payload);
export const applyOSGatepassExit = async (payload) => apiClient.post('/api/student/os-gatepass-exit', payload);
export const applyOSGatepassEntry = async (payload) => apiClient.post('/api/student/os-gatepass-entry', payload);

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
export const getAdminLiveLogs = async () => apiClient.get('/api/admin/live-logs');
export const getStudentsInside = async () => apiClient.get('/api/admin/students-inside');
export const getStudentsOutside = async () => apiClient.get('/api/admin/students-outside');
export const getLocalGatepassExits = async () => apiClient.get('/api/admin/local-gatepass-exits');
export const getOutstationGatepassExits = async () => apiClient.get('/api/admin/outstation-gatepass-exits');
export const getDetailedLogs = async () => apiClient.get('/api/admin/detailed-logs');
export const getAllStudents = async () => apiClient.get('/api/admin/all-students');
export const searchAdminStudents = async (q) =>
  apiClient.get('/api/admin/search-students', { params: { q } });
export const getStudentLogsById = async (studentId) =>
  apiClient.get(`/api/admin/student-logs/${studentId}`);

// Hostel Office APIs
export const getPendingGatepasses = async () => apiClient.get('/api/hostel-office/pending-gatepasses');
export const getGatepassHistory = async (search) =>
  apiClient.get('/api/hostel-office/gatepass-history', { params: { search } });
export const getEntryExitLogs = async (date, search) =>
  apiClient.get('/api/hostel-office/entry-exit-logs', { params: { date, search } });
export const decideGatepass = async (payload) => apiClient.post('/api/hostel-office/decide-gatepass', payload);

// Office Secretary APIs
export const getSecretaryPendingGatepasses = async () =>
  apiClient.get('/api/office-secretary/pending-gatepasses');
export const getSecretaryGatepassDetails = async (gatepassId) =>
  apiClient.get(`/api/office-secretary/gatepass/${gatepassId}`);
export const getStudentOSHistory = async (studentId) =>
  apiClient.get(`/api/office-secretary/student-history/${studentId}`);
export const getSecretaryGatepassHistory = async (search) =>
  apiClient.get('/api/office-secretary/gatepass-history', { params: { search } });
export const decideOutstationGatepass = async (payload) =>
  apiClient.post('/api/office-secretary/decide-gatepass', payload);

// DUGC APIs
export const getDugcPendingGatepasses = async () =>
  apiClient.get('/api/dugc/pending-gatepasses');
export const getDugcGatepassDetails = async (gatepassId) =>
  apiClient.get(`/api/dugc/gatepass/${gatepassId}`);
export const getDugcStudentOSHistory = async (studentId) =>
  apiClient.get(`/api/dugc/student-history/${studentId}`);
export const getDugcGatepassHistory = async (search) =>
  apiClient.get('/api/dugc/gatepass-history', { params: { search } });
export const decideDugcGatepass = async (payload) =>
  apiClient.post('/api/dugc/decide-gatepass', payload);

// HOD APIs
export const getHodPendingGatepasses = async () =>
  apiClient.get('/api/hod/pending-gatepasses');
export const getHodGatepassDetails = async (gatepassId) =>
  apiClient.get(`/api/hod/gatepass/${gatepassId}`);
export const getHodStudentOSHistory = async (studentId) =>
  apiClient.get(`/api/hod/student-history/${studentId}`);
export const getHodGatepassHistory = async (search) =>
  apiClient.get('/api/hod/gatepass-history', { params: { search } });
export const decideHodGatepass = async (payload) =>
  apiClient.post('/api/hod/decide-gatepass', payload);

// Student Outstation Gatepass APIs
export const getMyOutstationGatepasses = async () =>
  apiClient.get('/api/student/my-outstation-gatepasses');

export default apiClient;
