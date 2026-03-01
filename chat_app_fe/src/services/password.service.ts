import api from './api';

export interface RequestOTPData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export const passwordService = {
  // Request OTP để reset password
  requestOTP: async (data: RequestOTPData): Promise<void> => {
    await api.post('/password-reset/request', data);
  },

  // Verify OTP
  verifyOTP: async (data: VerifyOTPData): Promise<void> => {
    await api.post('/password-reset/verify', data);
  },

  // Reset password với OTP
  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await api.post('/password-reset/reset', data);
  },
};
