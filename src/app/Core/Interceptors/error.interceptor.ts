import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../Services/auth.service';
import { NotificationService } from '../Services/notification.service';
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notices = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLogin = request.url.endsWith('/Auth/login') || request.url.endsWith('/Auth/google');
      const isSessionProbe = request.headers.has('X-Session-Probe');
      const messages: Record<number, string> = {
        0: 'تعذر الاتصال بالخادم. تأكد أن Kemit API يعمل على https://localhost:7289.',
        400: 'راجع البيانات المدخلة.',
        401: isLogin
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
          : 'انتهت الجلسة، سجل الدخول مجددًا.',
        403: 'ليس لديك صلاحية لهذا الإجراء.',
        404: 'المحتوى غير موجود.',
        429: 'محاولات كثيرة، انتظر قليلًا.',
        500: 'حدث خطأ بالخادم.',
      };
      const serverMessage =
        typeof error.error === 'string'
          ? error.error
          : (error.error?.errorMessage ?? error.error?.message ?? error.error?.title);
      const translatedMessage =
        serverMessage === 'Please confirm your email first.'
          ? 'يجب تأكيد البريد الإلكتروني أولًا.'
          : serverMessage === 'Invalid Email Or Password !'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            : serverMessage;
      const message = translatedMessage ?? messages[error.status] ?? 'حدث خطأ غير متوقع.';
      const passivePublicRequest =
        request.method === 'GET' && !request.headers.has('Authorization');
      if (!isSessionProbe && !(error.status === 0 && passivePublicRequest)) notices.show(message, 'error');
      if (error.status === 401 && !isLogin && !isSessionProbe) {
        auth.clearSession();
        void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
