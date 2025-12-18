// Simple JWT decoding and auth helpers

const getToken = () => {
  return localStorage.getItem('token');
};

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  const { exp, userId, role } = decoded;

  if (exp && Date.now() >= exp * 1000) {
    // Token expired
    localStorage.removeItem('token');
    return null;
  }

  return { userId, role };
};

export const isAuthenticated = () => {
  return !!getUserFromToken();
};
