import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { passwordService } from '../services/password.service';

type Step = 'email' | 'otp' | 'reset';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await passwordService.requestOTP({ email });
      setSuccess('Mã OTP đã được gửi đến email của bạn!');
      setTimeout(() => {
        setStep('otp');
        setSuccess('');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await passwordService.verifyOTP({ email, otp });
      setSuccess('Mã OTP hợp lệ!');
      setTimeout(() => {
        setStep('reset');
        setSuccess('');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      await passwordService.resetPassword({ email, otp, newPassword });
      setSuccess('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to step 1
  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {step === 'email' && 'Nhập email để nhận mã OTP 📧'}
              {step === 'otp' && 'Nhập mã OTP đã gửi đến email 🔐'}
              {step === 'reset' && 'Đặt mật khẩu mới của bạn 🔑'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center w-full max-w-xs">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'email' ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold transition-all duration-300`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === 'otp' || step === 'reset' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-300'} transition-all duration-300`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'otp' ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' : step === 'reset' ? 'bg-gray-300 text-gray-600' : 'bg-gray-300 text-gray-600'} font-semibold transition-all duration-300`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === 'reset' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-300'} transition-all duration-300`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'reset' ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold transition-all duration-300`}>
                3
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  📧 Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  placeholder="example@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </div>
                ) : (
                  <span>Gửi mã OTP</span>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">
                  🔐 Mã OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 text-center text-2xl tracking-widest font-semibold"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Mã OTP đã được gửi đến <span className="font-semibold">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full mt-6 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </div>
                ) : (
                  <span>Xác nhận OTP</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full px-6 py-3 text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                ← Quay lại nhập email
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">
                  🔒 Mật khẩu mới
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  🔒 Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang đặt lại...</span>
                  </div>
                ) : (
                  <span>Đặt lại mật khẩu</span>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
          </div>

          {/* Back to login link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm md:text-base">
              Đã nhớ mật khẩu?{' '}
              <Link 
                to="/login" 
                className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Đăng nhập ngay 🚀
              </Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/80 text-sm mt-6">
          Mã OTP có hiệu lực trong 2 phút
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
