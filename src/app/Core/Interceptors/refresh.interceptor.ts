import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../Services/auth.service';

export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isAuthEndpoint = /\/Auth\/(login|register|google|refresh-token|logout)$/i.test(request.url);
  if (!request.url.startsWith(environment.apiOrigin) || isAuthEndpoint || !auth.isAuthenticated()) {
    return next(request);
  }
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);
      return auth.refreshSession().pipe(
        switchMap(() => next(request)),
        catchError(() => {
          auth.clearSession();
          return throwError(() => error);
        }),
      );
    }),
  );
};
