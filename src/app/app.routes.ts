import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { approvedGuard } from './guards/approved.guard';
import { roleGuard } from './guards/role.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'verify-email',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
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
    path: 'profile',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
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
    path: 'notifications',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/notifications/notifications.page').then((m) => m.NotificationsPage),
  },
  {
    path: 'worship-lineups',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/worship-lineups/worship-lineups-list.page').then((m) => m.WorshipLineupsListPage),
  },
  {
    path: 'worship-lineups/new',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/worship-lineups/worship-lineup-form.page').then((m) => m.WorshipLineupFormPage),
  },
  {
    path: 'worship-lineups/:id/edit',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/worship-lineups/worship-lineup-form.page').then((m) => m.WorshipLineupFormPage),
  },
  {
    path: 'worship-lineups/:id',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/worship-lineups/worship-lineup-detail.page').then((m) => m.WorshipLineupDetailPage),
  },
  {
    path: 'youth-profiles',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/youth-profiles/youth-profiles-list.page').then((m) => m.YouthProfilesListPage),
  },
  {
    path: 'youth-profiles/new',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/youth-profiles/youth-profile-form.page').then((m) => m.YouthProfileFormPage),
  },
  {
    path: 'youth-profiles/:id',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/youth-profiles/youth-profile-detail.page').then((m) => m.YouthProfileDetailPage),
  },
  {
    path: 'youth-profiles/:id/edit',
    canActivate: [authGuard, approvedGuard],
    loadComponent: () => import('./pages/youth-profiles/youth-profile-form.page').then((m) => m.YouthProfileFormPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
