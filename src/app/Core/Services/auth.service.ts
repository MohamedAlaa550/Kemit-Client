import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage, AuthResponse, User } from '../Models/api.models';
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  ResetPasswordRequest,
} from '../Models/auth.models';
import { PlateformService } from './plateform-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platform = inject(PlateformService);
  private readonly currentUserState = signal<User | null>(null);
  private readonly authenticatedState = signal(false);
  private refreshRequest?: Observable<AuthResponse>;
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = this.authenticatedState.asReadonly();

  login(request: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/login`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  googleLogin(request: GoogleLoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/google`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(formData: FormData) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/register`, formData)
      .pipe(tap((response) => this.saveSession(response)));
  }

  refreshSession() {
    if (this.refreshRequest) return this.refreshRequest;
    this.refreshRequest = this.http
      .post<AuthResponse>(`${environment.apiUrl}/Auth/refresh-token`, {})
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
    return this.http.get<AuthResponse | null>(`${environment.apiUrl}/Auth/session`).pipe(
      tap((session) => session ? this.saveSession(session) : this.clearSession()),
    );
  }

  getCurrentUser() {
    return this.http
      .get<User>(`${environment.apiUrl}/Auth/me`)
      .pipe(tap((user) => this.setCurrentUser(user)));
  }

  forgotPassword(request: ForgotPasswordRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/forget-password`, request);
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Auth/reset-password`, request);
  }

  checkEmail(email: string) {
    return this.http.get<boolean>(`${environment.apiUrl}/Auth/check-email`, { params: { email } });
  }

  logout() {
    return this.http
      .post<ApiMessage>(`${environment.apiUrl}/Auth/logout`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  clearSession() {
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
  }

  private setCurrentUser(user: User) {
    this.currentUserState.set(user);
    this.authenticatedState.set(true);
  }
}
