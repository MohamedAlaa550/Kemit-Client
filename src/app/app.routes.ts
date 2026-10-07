import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './Core/Guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./Features/home/home.component').then(m => m.HomeComponent) },
  { path: 'search', loadComponent: () => import('./Features/search/search-results.component').then(m => m.SearchResultsComponent) },
  { path: 'projects', loadChildren: () => import('./Features/projects/projects.routes').then(m => m.PROJECT_ROUTES) },
  { path: 'properties', loadChildren: () => import('./Features/advertisements/advertisements.routes').then(m => m.AD_ROUTES) },
  { path: 'advertisers/:id', loadComponent: () => import('./Features/advertisers/details/advertiser-details.component').then(m => m.AdvertiserDetailsComponent) },
  { path: 'developers', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'developers/:id', loadComponent: () => import('./Features/developers/developer-details.component').then(m => m.DeveloperDetailsComponent) },
  { path: 'favorites', canActivate: [authGuard], loadComponent: () => import('./Features/favorites/favorites.component').then(m => m.FavoritesComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./Features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'packages/payment-result', canActivate: [authGuard], loadComponent: () => import('./Features/packages/payment-result.component').then(m => m.PaymentResultComponent) },
  { path: 'packages', loadComponent: () => import('./Features/packages/packages.component').then(m => m.PackagesComponent) },
  { path: 'terms', data: { kind: 'terms' }, loadComponent: () => import('./Features/legal/legal-page.component').then(m => m.LegalPageComponent) },
  { path: 'privacy', data: { kind: 'privacy' }, loadComponent: () => import('./Features/legal/legal-page.component').then(m => m.LegalPageComponent) },
  { path: 'auth/login', canActivate: [guestGuard], loadComponent: () => import('./Features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', canActivate: [guestGuard], loadComponent: () => import('./Features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'confirm-email', loadComponent: () => import('./Features/auth/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent) },
  { path: 'auth/forgot-password', canActivate: [guestGuard], loadComponent: () => import('./Features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./Features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: '**', redirectTo: '' },
];
