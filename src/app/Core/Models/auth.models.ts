export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  avatar?: File | null;
}
export interface GoogleLoginRequest { idToken: string; }
export interface RefreshTokenRequest { refreshToken: string; }
export interface PhoneRequest { phoneNumber: string; }
export interface VerifyOtpRequest { phoneNumber: string; code: string; }
export interface OtpVerification { verificationToken: string; expiresAt: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
