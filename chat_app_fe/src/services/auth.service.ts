import api from './api';
import { API_ENDPOINTS } from '../config/constants';
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
  ApiResponse,
} from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<void> => {
    await api.post(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    // Tokens are now stored in cookies
  },

  register: async (credentials: RegisterCredentials): Promise<void> => {
    await api.post(
      API_ENDPOINTS.REGISTER,
      credentials
    );
    // Tokens are now stored in cookies
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(
      API_ENDPOINTS.GET_ME
    );
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.LOGOUT);
    // Cookies are cleared by the server
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post<ApiResponse<{ accessToken: string }>>(
      API_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken }
    );
    return response.data.data!;
  },
};
