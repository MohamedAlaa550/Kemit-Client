import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage, AuthResponse, User } from '../Models/api.models';
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  OtpVerification,
  PhoneRequest,
  VerifyOtpRequest,
} from '../Models/auth.models';
import { PlateformService } from './plateform-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly refreshLeadTimeMs = 60_000;
  private static readonly refreshRetryDelayMs = 30_000;
  private readonly http = inject(HttpClient);
  private readonly platform = inject(PlateformService);
  private readonly currentUserState = signal<User | null>(null);
  private readonly authenticatedState = signal(false);
  private refreshRequest?: Observable<AuthResponse>;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = this.authenticatedState.asReadonly();

  isAdministrator() {
    const roles = this.currentUserState()?.roles ?? [];
    return roles.includes('Admin') || roles.includes('SuperAdmin');
  }

  login(request: LoginRequest) {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/Auth/email-login`,
        { email: request.email.trim(), password: request.password },
      )
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(request: RegisterRequest) {
    const data = new FormData();
    data.append('firstName', request.firstName.trim());
    data.append('lastName', request.lastName.trim());
    data.append('email', request.email.trim());
    data.append('phoneNumber', request.phoneNumber.trim());
    data.append('password', request.password);
    data.append('confirmPassword', request.confirmPassword);
    if (request.avatar) data.append('avatar', request.avatar, request.avatar.name);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/register`, data)
      .pipe(tap((response) => this.saveSession(response)));
  }

  googleLogin(request: GoogleLoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/google`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  refreshSession() {
    if (this.refreshRequest) return this.refreshRequest;
    this.refreshRequest = this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/refresh-token`, {}, {
        headers: { 'X-Session-Refresh': '1' },
      })
      .pipe(
        tap((response) => this.saveSession(response)),
        finalize(() => (this.refreshRequest = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshRequest;
  }

  restoreSession() {
    if (!this.platform.checkPlateform()) return of(null);
    // Remove tokens left by older builds; authentication now relies only on HttpOnly cookies.
    localStorage.removeItem('kemit_access_token');
    localStorage.removeItem('kemit_refresh_token');
    return this.http.get<AuthResponse | null>(`${environment.apiUrl}/Auth/session`, {
      headers: { 'X-Session-Probe': '1' },
    }).pipe(
      tap((session) => session ? this.saveSession(session) : this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  getCurrentUser() {
    return this.http
      .get<User>(`${environment.apiUrl}/Auth/me`)
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  updateProfile(data: FormData) {
    return this.http
      .put<User>(`${environment.apiUrl}/Auth/profile`, data)
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  confirmEmail(userId: string, token: string) {
    return this.http.get<ApiMessage>(`${environment.apiUrl}/Auth/confirm-email`, {
      params: { userId, token },
    });
  }

  forgotPassword(request: ForgotPasswordRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/reset-password`, request);
  }

  requestPhoneLinkOtp(request: PhoneRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/whatsapp/link/request-otp`, request);
  }

  verifyPhoneLinkOtp(request: VerifyOtpRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/whatsapp/link/verify-otp`, request);
  }

  logout() {
    return this.http
      .post<ApiMessage>(`${environment.apiUrl}/Auth/logout`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  clearSession() {
    this.cancelScheduledRefresh();
    this.authenticatedState.set(false);
    this.currentUserState.set(null);
  }

  private saveSession(response: AuthResponse) {
    this.authenticatedState.set(true);
    this.currentUserState.set({
      id: response.userId,
      email: response.email,
      userName: response.userName,
      roles: response.roles,
    });
    this.scheduleRefresh(response.expiresAt);
  }

  private scheduleRefresh(expiresAt: string) {
    if (!this.platform.checkPlateform()) return;
    this.cancelScheduledRefresh();
    const expiresAtMs = Date.parse(expiresAt);
    const delay = Number.isFinite(expiresAtMs)
      ? Math.max(0, expiresAtMs - Date.now() - AuthService.refreshLeadTimeMs)
      : AuthService.refreshRetryDelayMs;
    this.refreshTimer = setTimeout(() => this.refreshInBackground(), delay);
  }

  private refreshInBackground() {
    if (!this.authenticatedState()) return;
    this.refreshSession().subscribe({
      error: () => {
        // A temporary API/cookie failure must not sign the user out. Keep retrying
        // in the background; an explicit logout remains the only local sign-out path.
        this.refreshTimer = setTimeout(
          () => this.refreshInBackground(),
          AuthService.refreshRetryDelayMs,
        );
      },
    });
  }

  private cancelScheduledRefresh() {
    if (this.refreshTimer !== undefined) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private setCurrentUser(user: User) {
    this.currentUserState.set({
      ...user,
      roles: user.roles ?? this.currentUserState()?.roles ?? [],
    });
    this.authenticatedState.set(true);
  }
}
