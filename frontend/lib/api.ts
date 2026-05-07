// API client service
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// API methods
export const authAPI = {
  register: (email: string, password: string, timezone?: string) =>
    apiClient.post('/auth/register', { email, password, timezone }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/me'),
};

export const blueprintAPI = {
  list: (active?: boolean) =>
    apiClient.get('/blueprints', { params: { active } }),
  get: (id: string) => apiClient.get(`/blueprints/${id}`),
  getDomains: (id: string) => apiClient.get(`/blueprints/${id}/domains`),
};

export const examFormAPI = {
  list: (blueprintId?: string) =>
    apiClient.get('/exam-forms', { params: { blueprintId } }),
  get: (id: string) => apiClient.get(`/exam-forms/${id}`),
};

export const sessionAPI = {
  create: (examFormId: string, mode: 'SIMULATION' | 'STUDY') =>
    apiClient.post('/exam-sessions', { examFormId, mode }),
  getCurrentQuestion: (sessionId: string, questionIndex: number) =>
    apiClient.get(`/exam-sessions/${sessionId}/current`, {
      params: { questionIndex },
    }),
  submitAnswer: (
    sessionId: string,
    questionIndex: number,
    selectedOptionIds?: string[],
    freeTextAnswer?: string,
    responseTimeMs?: number,
  ) =>
    apiClient.post(`/exam-sessions/${sessionId}/answers`, {
      questionIndex,
      selectedOptionIds,
      freeTextAnswer,
      responseTimeMs,
    }),
  complete: (sessionId: string) =>
    apiClient.post(`/exam-sessions/${sessionId}/complete`),
  getResult: (sessionId: string) =>
    apiClient.get(`/exam-sessions/${sessionId}/result`),
  getHistory: (userId: string) =>
    apiClient.get(`/exam-sessions/user/${userId}/history`),
};
