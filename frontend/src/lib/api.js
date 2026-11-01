import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

const api = axios.create({ baseURL: API_URL });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// If the session is no longer valid (expired token, or the account was suspended),
// drop it and send the user to the login screen with an explanation.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || '';
    const hadSession = Boolean(getStoredUser());

    if (hadSession && (status === 401 || (status === 403 && message.includes('suspended')))) {
      localStorage.removeItem('user');
      localStorage.setItem(
        'authMessage',
        status === 401 ? 'Your session expired. Please sign in again.' : message
      );
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
