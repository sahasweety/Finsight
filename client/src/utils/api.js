export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

