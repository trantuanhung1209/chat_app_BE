import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies
    });

    // Request interceptor - cookies are sent automatically
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // No need to manually add token, cookies handle it
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't retry for auth/me endpoint or if already retried
        if (
          error.response?.status === 401 && 
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/me') &&
          !originalRequest.url?.includes('/auth/refresh-token')
        ) {
          originalRequest._retry = true;

          try {
            // Call refresh-token endpoint (cookies are sent automatically)
            await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              {},
              { withCredentials: true }
            );

            // Retry the original request (with refreshed cookies)
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh token failed, redirect to login only if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getApi(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService().getApi();
