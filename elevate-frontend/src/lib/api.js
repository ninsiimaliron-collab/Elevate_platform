import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elevate_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const pickData = (response) => {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export const authApi = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  me: () => api.get('/users/me'),
  verifyAccount: (body) => api.post('/auth/verify-account', body),
  changePassword: (body) => api.post('/auth/change-password', body)
};

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }),
  myListings: () => api.get('/jobs/my/listings'),
  create: (body) => api.post('/jobs', body),
  update: (jobId, body) => api.put(`/jobs/${jobId}`, body),
  publish: (jobId) => api.patch(`/jobs/${jobId}/publish`),
  close: (jobId) => api.patch(`/jobs/${jobId}/close`),
  delete: (jobId) => api.delete(`/jobs/${jobId}`)
};

export const resourcesApi = {
  list: (params) => api.get('/resources', { params }),
  myBookmarks: () => api.get('/resources/my/bookmarks')
};

export const applicationsApi = {
  my: (params) => api.get('/applications/my', { params }),
  apply: (jobId, body) => api.post(`/applications/jobs/${jobId}/apply`, body),
  jobApplicants: (jobId) => api.get(`/applications/jobs/${jobId}/applicants`),
  updateStatus: (applicationId, status) => api.patch(`/applications/${applicationId}/status`, { status })
};

export { api, pickData, API_URL };
