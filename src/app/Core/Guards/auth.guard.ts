import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { TranslationService } from '../I18n/translation.service';
import { AuthService } from '../Services/auth.service';
import { NotificationService } from '../Services/notification.service';

export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notices = inject(NotificationService);
  const translations = inject(TranslationService);

  return auth.restoreSession().pipe(
    map(() => {
      if (auth.isAuthenticated()) return true;
      notices.show(translations.translate('loginRequired'), 'info');
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.restoreSession().pipe(
    map(() => !auth.isAuthenticated() || router.createUrlTree(['/profile'])),
  );
};
