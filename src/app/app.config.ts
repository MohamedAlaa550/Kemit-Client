import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeArEg from '@angular/common/locales/ar-EG';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './Core/Interceptors/auth.interceptor';
import { errorInterceptor } from './Core/Interceptors/error.interceptor';
import { loadingInterceptor } from './Core/Interceptors/loading.interceptor';
import { refreshInterceptor } from './Core/Interceptors/refresh.interceptor';
import { AuthService } from './Core/Services/auth.service';

// CurrencyPipe and other locale-aware pipes need locale data registered
// explicitly in standalone applications. This config is shared by browser and SSR.
registerLocaleData(localeArEg, 'ar-EG');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession())),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withViewTransitions(),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, refreshInterceptor, loadingInterceptor]),
    ),
  ],
};
