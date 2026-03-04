import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { approvedGuard } from './guards/approved.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'pending',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/pending/pending.page').then((m) => m.PendingPage),
  },
  {
    path: 'home',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
