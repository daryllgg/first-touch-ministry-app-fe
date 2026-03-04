import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { approvedGuard } from './guards/approved.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'pending',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pending/pending.page').then((m) => m.PendingPage),
  },
  {
    path: 'home',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'admin',
    canActivate: [authGuard, approvedGuard, roleGuard('ADMIN', 'SUPER_ADMIN')],
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'announcements',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/announcements/announcements-list.page').then((m) => m.AnnouncementsListPage),
  },
  {
    path: 'announcements/new',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/announcements/announcement-form.page').then((m) => m.AnnouncementFormPage),
  },
  {
    path: 'prayer-requests',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/prayer-requests/prayer-requests-list.page').then((m) => m.PrayerRequestsListPage),
  },
  {
    path: 'prayer-requests/new',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/prayer-requests/prayer-request-form.page').then((m) => m.PrayerRequestFormPage),
  },
  {
    path: 'worship-schedules',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/worship-schedules/worship-schedules-list.page').then((m) => m.WorshipSchedulesListPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
