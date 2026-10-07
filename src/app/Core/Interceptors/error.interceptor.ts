import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorMessageService } from '../Services/api-error-message.service';
import { NotificationService } from '../Services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notices = inject(NotificationService);
  const errorMessages = inject(ApiErrorMessageService);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLogin = request.url.endsWith('/Auth/login')
        || request.url.endsWith('/Auth/email-login')
        || request.url.endsWith('/Auth/google');
      const isSessionProbe = request.headers.has('X-Session-Probe');
      const isSessionRefresh = request.headers.has('X-Session-Refresh');
      const passivePublicRequest = request.method === 'GET' && !request.headers.has('Authorization');
      if (!isSessionProbe && !isSessionRefresh && !(error.status === 0 && passivePublicRequest)) {
        notices.show(errorMessages.message(error, isLogin), 'error');
      }
      return throwError(() => error);
    }),
  );
};
