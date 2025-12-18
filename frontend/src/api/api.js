import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  withCredentials: false,
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

export default apiClient;
