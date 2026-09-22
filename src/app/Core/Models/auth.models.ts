export interface LoginRequest { email: string; password: string; }
export interface GoogleLoginRequest { idToken: string; }
export interface RefreshTokenRequest { refreshToken: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
