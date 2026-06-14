import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import App from './App.jsx'
import axios from 'axios';

console.log("Main.jsx: Executing");

// Generate persistent device ID
let deviceId = localStorage.getItem('aisleDeviceId');
if (!deviceId) {
  deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('aisleDeviceId', deviceId);
}

// Global Fetch Interceptor for Auth Errors
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0];
  const response = await originalFetch(...args);
  
  if (response.status === 401 || response.status === 403) {
    const isAuthRoute = typeof url === 'string' && (
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/send-otp') ||
      url.includes('/api/auth/verify-otp') ||
      url.includes('/api/auth/check-exists')
    );
    
    if (!isAuthRoute) {
      console.warn("Global fetch interceptor: Session expired or invalid, logging out");
      localStorage.removeItem('aisleUser');
      localStorage.removeItem('aisleToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
  return response;
};

// Request Interceptor
axios.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('aisleUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.token) {
        config.headers.Authorization = `Bearer ${parsedUser.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Silent Token Refresh)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/api/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedUser = localStorage.getItem('aisleUser');
        let refreshSuccessful = false;
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.refreshToken) {
            const res = await axios.post('/api/auth/refresh-token', {
              refreshToken: parsedUser.refreshToken,
              deviceId: localStorage.getItem('aisleDeviceId')
            });

            if (res.status === 200) {
              const { token, refreshToken } = res.data;
              parsedUser.token = token;
              parsedUser.refreshToken = refreshToken;
              
              localStorage.setItem('aisleUser', JSON.stringify(parsedUser));
              localStorage.setItem('aisleToken', token);
              
              processQueue(null, token);
              isRefreshing = false;
              refreshSuccessful = true;
              
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }
          }
        }
        if (!refreshSuccessful) {
          isRefreshing = false;
          processQueue(new Error("Token refresh failed"), null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        console.warn("Session refresh failed, logging out.");
        localStorage.removeItem('aisleUser');
        localStorage.removeItem('aisleToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
