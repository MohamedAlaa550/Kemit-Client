import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiOrigin)) return next(request);
  return next(
    request.clone({
      withCredentials: true,
      setHeaders: { Accept: 'application/json', 'X-Kemit-Request': '1' },
    }),
  );
};
