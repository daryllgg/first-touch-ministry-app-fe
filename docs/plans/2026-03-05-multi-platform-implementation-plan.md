# Multi-Platform Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the FTM church app into a multi-platform application with native Ionic UI on mobile and a full desktop web layout with sidebar navigation, top bar, card grids, and split-screen auth pages.

**Architecture:** Angular file replacements swap HTML templates and SCSS per platform at build time. Shared TypeScript logic across all platforms. Mobile uses Ionic components; web uses standard HTML/CSS. NPM scripts target each platform (`start:web`, `start:mobile`, `build:ios`, `build:android`).

**Tech Stack:** Angular 18, Ionic 8, Capacitor 6, TypeScript, SCSS, CSS Grid/Flexbox

---

## Phase 1: Infrastructure

### Task 1: Extract AppComponent Inline Template to External Files

The `AppComponent` (`src/app/app.component.ts`) currently uses inline `template:` and `styles:[]`. Angular's `fileReplacements` only works on external files, so we must extract these first.

**Files:**
- Modify: `src/app/app.component.ts`
- Create: `src/app/app.component.html`
- Create: `src/app/app.component.scss`

**Step 1: Create `src/app/app.component.html`**

Copy the entire inline template string (lines 32–146 of `app.component.ts`, the content between the backticks after `template:`) into this new file. The template starts with `<ion-app>` and ends with `</ion-app>`.

**Step 2: Create `src/app/app.component.scss`**

Copy the entire inline styles string (lines 148–317 of `app.component.ts`, the content between the backticks inside `styles:[]`) into this new file.

**Step 3: Update `src/app/app.component.ts`**

Replace the `template:` and `styles:[]` properties in the `@Component` decorator with:

```typescript
templateUrl: './app.component.html',
styleUrls: ['./app.component.scss'],
```

Remove the inline template and styles strings entirely.

**Step 4: Verify build**

Run: `npx ng build --configuration=development`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.html src/app/app.component.scss
git commit -m "refactor: extract AppComponent inline template and styles to external files"
```

---

### Task 2: Extract ProfilePage Inline Template to External Files

The `ProfilePage` (`src/app/pages/profile/profile.page.ts`) also uses inline `template:` and `styles:[]`. Same extraction needed.

**Files:**
- Modify: `src/app/pages/profile/profile.page.ts`
- Create: `src/app/pages/profile/profile.page.html`
- Create: `src/app/pages/profile/profile.page.scss`

**Step 1: Create `src/app/pages/profile/profile.page.html`**

Copy the inline template (the HTML between backticks after `template:` in `profile.page.ts`) into this new file. Starts with `<ion-header>`, ends with `</ion-content>`.

**Step 2: Create `src/app/pages/profile/profile.page.scss`**

Copy the inline styles (the SCSS between backticks inside `styles:[]`) into this new file.

**Step 3: Update `src/app/pages/profile/profile.page.ts`**

Replace:
```typescript
template: `...`,
styles: [`...`],
```
With:
```typescript
templateUrl: './profile.page.html',
styleUrls: ['./profile.page.scss'],
```

**Step 4: Verify build**

Run: `npx ng build --configuration=development`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add src/app/pages/profile/profile.page.ts src/app/pages/profile/profile.page.html src/app/pages/profile/profile.page.scss
git commit -m "refactor: extract ProfilePage inline template and styles to external files"
```

---

### Task 3: Set Up Angular Build Configurations

Add `web` and `web-dev` build configurations to `angular.json` with file replacements for the web shell. Also add NPM scripts.

**Files:**
- Modify: `angular.json`
- Modify: `package.json`

**Step 1: Add web configurations to `angular.json`**

In `projects.church-app-ui.architect.build.configurations`, add two new configurations:

```json
"web": {
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2MB",
      "maximumError": "5MB"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kB",
      "maximumError": "10kB"
    }
  ],
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    },
    {
      "replace": "src/styles.scss",
      "with": "src/styles.web.scss"
    },
    {
      "replace": "src/app/app.component.html",
      "with": "src/app/app.component.web.html"
    },
    {
      "replace": "src/app/app.component.scss",
      "with": "src/app/app.component.web.scss"
    }
  ],
  "outputHashing": "all"
},
"web-dev": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true,
  "fileReplacements": [
    {
      "replace": "src/styles.scss",
      "with": "src/styles.web.scss"
    },
    {
      "replace": "src/app/app.component.html",
      "with": "src/app/app.component.web.html"
    },
    {
      "replace": "src/app/app.component.scss",
      "with": "src/app/app.component.web.scss"
    }
  ]
}
```

In `projects.church-app-ui.architect.serve.configurations`, add:

```json
"web": {
  "buildTarget": "church-app-ui:build:web"
},
"web-dev": {
  "buildTarget": "church-app-ui:build:web-dev"
}
```

**Step 2: Add NPM scripts to `package.json`**

Update the `"scripts"` section:

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "start:mobile": "ng serve",
  "start:web": "ng serve --configuration=web-dev",
  "build": "ng build",
  "build:mobile": "ng build",
  "build:web": "ng build --configuration=web",
  "build:ios": "ng build && npx cap sync ios",
  "build:android": "ng build && npx cap sync android",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

**Step 3: Commit**

```bash
git add angular.json package.json
git commit -m "feat: add web build configurations and npm scripts"
```

---

### Task 4: Create Web Global Styles

Create the web-specific global stylesheet that does NOT import Ionic CSS. Uses the same design tokens but standard HTML styling.

**Files:**
- Create: `src/styles.web.scss`

**Step 1: Create `src/styles.web.scss`**

This file replaces `src/styles.scss` on web builds. It must NOT import any `@ionic/angular/css/*` files. It should import the shared variables and define web-specific global styles.

```scss
/* Google Fonts — Inter for all text */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Import shared design tokens */
@import 'theme/variables';

/* ─── CSS Reset & Base ─── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--ion-background-color, #f4f6fa);
  color: var(--ion-color-dark, #1e293b);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ─── Typography ─── */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ion-color-dark);
  margin-top: 0;
  margin-bottom: 0.5em;
}

h1 { font-size: 1.8rem; line-height: 1.2; }
h2 { font-size: 1.5rem; line-height: 1.25; }
h3 { font-size: 1.2rem; line-height: 1.3; }
h4 { font-size: 1.05rem; line-height: 1.35; }

p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 0.75em;
}

a {
  color: var(--ion-color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

/* ─── Buttons ─── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--app-radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;

  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.btn-primary {
  background: var(--ion-color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(26, 58, 74, 0.2);

  &:hover:not(:disabled) { background: var(--ion-color-primary-shade); }
}

.btn-secondary {
  background: var(--ion-color-secondary);
  color: white;

  &:hover:not(:disabled) { background: var(--ion-color-secondary-shade); }
}

.btn-outline {
  background: transparent;
  color: var(--ion-color-primary);
  border: 1.5px solid var(--ion-color-primary);

  &:hover:not(:disabled) { background: rgba(26, 58, 74, 0.05); }
}

.btn-danger {
  background: var(--ion-color-danger);
  color: white;

  &:hover:not(:disabled) { background: var(--ion-color-danger-shade); }
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
}

.btn-block {
  width: 100%;
}

.btn-icon {
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--ion-color-medium);
  cursor: pointer;

  &:hover { background: #f1f5f9; color: var(--ion-color-primary); }
}

/* ─── Cards ─── */
.card {
  background: white;
  border-radius: var(--app-radius-md);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}

.card-clickable {
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.card-header {
  padding: var(--app-spacing-md) var(--app-spacing-lg) var(--app-spacing-xs);
}

.card-body {
  padding: var(--app-spacing-sm) var(--app-spacing-lg) var(--app-spacing-lg);
}

.card-footer {
  padding: var(--app-spacing-sm) var(--app-spacing-lg);
  border-top: 1px solid #f1f5f9;
}

/* ─── Forms ─── */
.form-group {
  margin-bottom: var(--app-spacing-md);
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ion-color-dark);
  margin-bottom: 6px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: var(--ion-color-dark);
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 3px rgba(26, 58, 74, 0.1);
  }

  &::placeholder { color: #cbd5e1; }
  &:disabled { background: #f8fafc; color: #94a3b8; }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-error {
  font-size: 0.8rem;
  color: var(--ion-color-danger);
  margin-top: 4px;
}

/* ─── Badges ─── */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 4px 12px;
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.badge-primary { background: rgba(26, 58, 74, 0.1); color: var(--ion-color-primary); }
.badge-success { background: rgba(52, 199, 89, 0.1); color: var(--ion-color-success); }
.badge-warning { background: rgba(245, 166, 35, 0.1); color: var(--ion-color-warning); }
.badge-danger  { background: rgba(231, 76, 60, 0.1); color: var(--ion-color-danger); }

/* ─── Card Grid ─── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-spacing-lg);
}

@media (max-width: 1024px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; }
}

/* ─── Page Header ─── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-spacing-lg);

  h1 {
    font-size: 1.5rem;
    margin: 0;
  }
}

/* ─── Section Label ─── */
.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ion-color-medium);
  margin: var(--app-spacing-lg) 0 var(--app-spacing-sm);
}

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-spacing-2xl) var(--app-spacing-md);
  text-align: center;
  color: var(--ion-color-medium);

  .empty-icon {
    font-size: 56px;
    color: #cbd5e1;
    margin-bottom: var(--app-spacing-md);
  }

  p { color: var(--ion-color-medium); font-size: 0.95rem; margin: 0; }
}

/* ─── Avatar ─── */
.avatar-placeholder {
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.avatar-img {
  border-radius: 50%;
  object-fit: cover;
}

/* ─── Stat Cards ─── */
.stat-card {
  background: white;
  border-radius: var(--app-radius-md);
  padding: var(--app-spacing-lg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--ion-color-primary);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--ion-color-medium);
    margin-top: 4px;
  }
}

/* ─── Spinner ─── */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Toast ─── */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 10px;
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  z-index: 10000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.toast-success { background: var(--ion-color-success); }
.toast-danger { background: var(--ion-color-danger); }
.toast-warning { background: var(--ion-color-warning); }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ─── Utilities ─── */
.text-center { text-align: center; }
.text-muted { color: var(--ion-color-medium); }
.text-sm { font-size: 0.85rem; }
.text-xs { font-size: 0.75rem; }
.mt-sm { margin-top: var(--app-spacing-sm); }
.mt-md { margin-top: var(--app-spacing-md); }
.mt-lg { margin-top: var(--app-spacing-lg); }
.mb-sm { margin-bottom: var(--app-spacing-sm); }
.mb-md { margin-bottom: var(--app-spacing-md); }
.mb-lg { margin-bottom: var(--app-spacing-lg); }
.gap-sm { gap: var(--app-spacing-sm); }
.gap-md { gap: var(--app-spacing-md); }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
```

**Step 2: Commit**

```bash
git add src/styles.web.scss
git commit -m "feat: add web global styles (no Ionic CSS imports)"
```

---

### Task 5: Create Web App Shell

Create the web-specific app component template with sidebar navigation and top bar.

**Files:**
- Create: `src/app/app.component.web.html`
- Create: `src/app/app.component.web.scss`

**Step 1: Create `src/app/app.component.web.html`**

This is the web shell with sidebar + top bar. It uses the same component class properties and methods as the mobile template (`currentUser`, `isAdmin`, `unreadCount`, `activeTab`, `logout()`, `getProfilePicUrl()`).

```html
<div class="web-layout" *ngIf="currentUser; else authLayout">
  <!-- Top Bar -->
  <header class="topbar">
    <div class="topbar-left">
      <img src="assets/logos/FTM Logomark.png" alt="FTM" class="topbar-logo" />
      <span class="topbar-title">First Touch Ministry</span>
    </div>
    <div class="topbar-right">
      <a routerLink="/notifications" class="topbar-icon-btn" title="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        @if (unreadCount > 0) {
          <span class="topbar-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        }
      </a>
      <div class="topbar-user">
        @if (currentUser.profilePicture) {
          <img [src]="getProfilePicUrl(currentUser.profilePicture)" alt="Profile" class="topbar-avatar" />
        } @else {
          <div class="topbar-avatar-placeholder">
            {{ currentUser.firstName?.charAt(0) }}{{ currentUser.lastName?.charAt(0) }}
          </div>
        }
        <span class="topbar-user-name">{{ currentUser.firstName }}</span>
      </div>
    </div>
  </header>

  <!-- Sidebar + Content -->
  <div class="web-body">
    <nav class="sidebar">
      <div class="sidebar-nav">
        <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </a>
        <a routerLink="/announcements" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          <span>Announcements</span>
        </a>
        <a routerLink="/prayer-requests" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/><path d="M21 12a3 3 0 0 0-3-3h-2.4a1 1 0 0 1-1-1.2l.5-3a2 2 0 0 0-2-2.4 1 1 0 0 0-.9.6L9 11v9h9.5a2 2 0 0 0 2-1.5l1.4-7a2 2 0 0 0-1-2.5z"/></svg>
          <span>Prayer Requests</span>
        </a>
        <a routerLink="/worship-lineups" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <span>Worship Lineups</span>
        </a>
        <a routerLink="/youth-profiles" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Kids and Teens</span>
        </a>
        <a routerLink="/notifications" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Notifications</span>
          @if (unreadCount > 0) {
            <span class="sidebar-badge">{{ unreadCount }}</span>
          }
        </a>
      </div>

      <div class="sidebar-bottom">
        @if (isAdmin) {
          <a routerLink="/admin" routerLinkActive="active" class="sidebar-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Admin Panel</span>
          </a>
        }
        <a routerLink="/profile" routerLinkActive="active" class="sidebar-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>My Profile</span>
        </a>
        <button class="sidebar-link logout-link" (click)="logout()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>

    <main class="web-content">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>

<ng-template #authLayout>
  <router-outlet></router-outlet>
</ng-template>
```

**Step 2: Create `src/app/app.component.web.scss`**

```scss
.web-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* ─── Top Bar ─── */
.topbar {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.topbar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.topbar-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--ion-color-medium);
  transition: background 0.2s, color 0.2s;
  text-decoration: none;

  &:hover {
    background: #f1f5f9;
    color: var(--ion-color-primary);
    text-decoration: none;
  }
}

.topbar-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  background: var(--ion-color-danger);
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 10px;
  transition: background 0.2s;

  &:hover { background: #f1f5f9; }
}

.topbar-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.topbar-avatar-placeholder {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.topbar-user-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

/* ─── Body (Sidebar + Content) ─── */
.web-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── Sidebar ─── */
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 16px 12px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  font-family: 'Inter', sans-serif;

  svg { flex-shrink: 0; color: #94a3b8; transition: color 0.2s; }

  &:hover {
    background: #f1f5f9;
    color: var(--ion-color-primary);
    text-decoration: none;

    svg { color: var(--ion-color-primary); }
  }

  &.active {
    background: #e8f1f5;
    color: var(--ion-color-primary);
    font-weight: 600;

    svg { color: var(--ion-color-primary); }
  }
}

.sidebar-badge {
  margin-left: auto;
  background: var(--ion-color-danger);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  margin-top: 12px;
}

.logout-link {
  color: var(--ion-color-danger) !important;

  svg { color: var(--ion-color-danger) !important; }

  &:hover { background: rgba(231, 76, 60, 0.05); }
}

/* ─── Main Content ─── */
.web-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background: var(--ion-background-color, #f4f6fa);
}

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .sidebar { width: 200px; }
  .web-content { padding: 24px 28px; }
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .topbar-title { display: none; }
  .topbar-user-name { display: none; }
  .web-content { padding: 20px; }
}
```

**Step 3: Verify web build**

Run: `npx ng build --configuration=web-dev`
Expected: Build succeeds. The web build uses `app.component.web.html` + `app.component.web.scss` + `styles.web.scss`.

**Step 4: Commit**

```bash
git add src/app/app.component.web.html src/app/app.component.web.scss
git commit -m "feat: add web app shell with sidebar navigation and top bar"
```

---

### Task 6: Verify Both Builds Work

**Step 1: Test mobile build**

Run: `npx ng build --configuration=development`
Expected: Build succeeds using original mobile templates.

**Step 2: Test web build**

Run: `npx ng build --configuration=web-dev`
Expected: Build succeeds using web templates.

**Step 3: Test mobile serve**

Run: `npm run start:mobile` (verify app loads in browser with Ionic bottom tabs)

**Step 4: Test web serve**

Run: `npm run start:web` (verify app loads in browser with sidebar layout)

**Step 5: Commit (if any fixes were needed)**

---

## Phase 2: Auth Pages (Web)

### Task 7: Create Web Login Page

**Files:**
- Create: `src/app/pages/login/login.page.web.html`
- Create: `src/app/pages/login/login.page.web.scss`
- Modify: `angular.json` (add file replacements)

**Step 1: Create `src/app/pages/login/login.page.web.html`**

Split-screen layout: branded panel on left, form on right. Uses the same component class properties: `loginForm`, `isLoading`, `onLogin()`.

```html
<div class="auth-split">
  <div class="auth-brand">
    <div class="auth-brand-content">
      <img src="assets/logos/FTM Logo.png" alt="First Touch Ministry" class="auth-logo" />
      <p class="auth-tagline">Touching God. Touching People.</p>
    </div>
  </div>

  <div class="auth-form-panel">
    <div class="auth-form-wrapper">
      <h1>Welcome back</h1>
      <p class="auth-subtitle">Sign in to your account</p>

      <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-input"
            formControlName="email"
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            type="password"
            class="form-input"
            formControlName="password"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block btn-lg"
          [disabled]="isLoading || loginForm.invalid"
        >
          @if (isLoading) {
            <span class="spinner"></span>
          } @else {
            Sign In
          }
        </button>
      </form>

      <p class="auth-footer-text">
        Don't have an account?
        <a routerLink="/verify-email">Register</a>
      </p>
    </div>
  </div>
</div>
```

**Step 2: Create `src/app/pages/login/login.page.web.scss`**

```scss
.auth-split {
  display: flex;
  min-height: 100vh;
}

.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, #1a3a4a 0%, #2e5d73 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.auth-brand-content {
  text-align: center;
  color: white;
}

.auth-logo {
  max-width: 240px;
  width: 80%;
  margin-bottom: 24px;
}

.auth-tagline {
  font-size: 1.2rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
  margin: 0;
}

.auth-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #f4f6fa;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 400px;

  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--ion-color-dark);
    margin-bottom: 8px;
  }
}

.auth-subtitle {
  color: var(--ion-color-medium);
  margin-bottom: 32px;
}

.auth-footer-text {
  text-align: center;
  margin-top: 24px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;

  a {
    color: var(--ion-color-primary);
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .auth-split { flex-direction: column; }
  .auth-brand { min-height: 200px; flex: 0; padding: 32px; }
  .auth-logo { max-width: 160px; }
  .auth-form-panel { padding: 32px 24px; }
}
```

**Step 3: Add file replacements to `angular.json`**

Add these entries to both `web` and `web-dev` configurations' `fileReplacements` arrays:

```json
{
  "replace": "src/app/pages/login/login.page.html",
  "with": "src/app/pages/login/login.page.web.html"
},
{
  "replace": "src/app/pages/login/login.page.scss",
  "with": "src/app/pages/login/login.page.web.scss"
}
```

**Step 4: Verify web build**

Run: `npx ng build --configuration=web-dev`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/pages/login/login.page.web.html src/app/pages/login/login.page.web.scss angular.json
git commit -m "feat: add web split-screen login page"
```

---

### Task 8: Create Web Register Page

Same split-screen pattern as login. Uses existing `RegisterPage` component class.

**Files:**
- Create: `src/app/pages/register/register.page.web.html`
- Create: `src/app/pages/register/register.page.web.scss`
- Modify: `angular.json`

**Step 1: Create `src/app/pages/register/register.page.web.html`**

Read `src/app/pages/register/register.page.ts` to understand all form fields and methods. Create a split-screen layout matching the login web page pattern. Left panel: branded with logo/tagline. Right panel: registration form with all existing fields (firstName, lastName, email, password, confirmPassword) using standard HTML form elements. Same `registerForm` FormGroup, same `onRegister()` method.

**Step 2: Create `src/app/pages/register/register.page.web.scss`**

Reuse the same auth split-screen SCSS pattern from login (`.auth-split`, `.auth-brand`, `.auth-form-panel`, etc.).

**Step 3: Add file replacements to `angular.json`**

Add to both `web` and `web-dev`:
```json
{
  "replace": "src/app/pages/register/register.page.html",
  "with": "src/app/pages/register/register.page.web.html"
},
{
  "replace": "src/app/pages/register/register.page.scss",
  "with": "src/app/pages/register/register.page.web.scss"
}
```

**Step 4: Verify and commit**

---

### Task 9: Create Web Verify Email Page

Same split-screen pattern. Uses existing `VerifyEmailPage` component class.

**Files:**
- Create: `src/app/pages/verify-email/verify-email.page.web.html`
- Create: `src/app/pages/verify-email/verify-email.page.web.scss`
- Modify: `angular.json`

Follow the same pattern as Tasks 7-8: read the existing component TS to understand all properties/methods, create split-screen layout, add file replacements.

---

### Task 10: Create Web Pending Page

Simple centered card on web. Uses existing `PendingPage` component class.

**Files:**
- Create: `src/app/pages/pending/pending.page.web.html`
- Create: `src/app/pages/pending/pending.page.web.scss`
- Modify: `angular.json`

---

## Phase 3: Home Dashboard (Web)

### Task 11: Create Web Home Page

**Files:**
- Create: `src/app/home/home.page.web.html`
- Create: `src/app/home/home.page.web.scss`
- Modify: `src/app/home/home.page.ts` (may need additional data for stat cards)
- Modify: `angular.json`

**Step 1: Update `home.page.ts` if needed**

The web dashboard shows stat cards (announcement count, prayer request count, notification count). If these counts aren't already available, add properties and load them. Currently the component only loads `announcements` (sliced to 5). You may need to add counts or use existing service data.

**Step 2: Create `src/app/home/home.page.web.html`**

```html
<div class="dashboard">
  <div class="welcome-banner">
    <div class="welcome-text">
      <h1>Welcome back, {{ userName }}!</h1>
      <p>Here's what's happening at First Touch Ministry</p>
    </div>
    <img src="assets/logos/FTM Logomark.png" alt="FTM" class="welcome-logo" />
  </div>

  <div class="stat-grid">
    <a routerLink="/announcements" class="stat-card">
      <div class="stat-value">{{ announcements.length }}</div>
      <div class="stat-label">Recent Announcements</div>
    </a>
    <a routerLink="/notifications" class="stat-card">
      <div class="stat-value">{{ unreadNotifCount }}</div>
      <div class="stat-label">Unread Notifications</div>
    </a>
    <a routerLink="/prayer-requests" class="stat-card">
      <div class="stat-value">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/><path d="M21 12a3 3 0 0 0-3-3h-2.4a1 1 0 0 1-1-1.2l.5-3a2 2 0 0 0-2-2.4 1 1 0 0 0-.9.6L9 11v9h9.5a2 2 0 0 0 2-1.5l1.4-7a2 2 0 0 0-1-2.5z"/></svg>
      </div>
      <div class="stat-label">Prayer Requests</div>
    </a>
  </div>

  <div class="section-label">Recent Announcements</div>

  @if (announcements.length === 0) {
    <div class="empty-state">
      <p>No announcements yet.</p>
    </div>
  } @else {
    <div class="card-grid">
      @for (a of announcements; track a.id) {
        <a [routerLink]="['/announcements']" class="card card-clickable">
          <div class="card-body">
            <h3>{{ a.title }}</h3>
            <p class="text-sm">{{ a.content | slice:0:100 }}{{ a.content.length > 100 ? '...' : '' }}</p>
            <span class="text-xs text-muted">{{ a.createdAt | date:'mediumDate' }}</span>
          </div>
        </a>
      }
    </div>
  }
</div>
```

**Step 3: Create `src/app/home/home.page.web.scss`**

```scss
.dashboard {
  max-width: 1200px;
}

.welcome-banner {
  background: linear-gradient(135deg, #1a3a4a 0%, #2e5d73 100%);
  border-radius: var(--app-radius-lg);
  padding: 36px 40px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-spacing-xl);
  box-shadow: 0 8px 32px rgba(26, 58, 74, 0.2);

  h1 {
    color: white;
    font-size: 1.6rem;
    margin-bottom: 6px;
  }

  p {
    color: rgba(255, 255, 255, 0.75);
    margin: 0;
    font-size: 0.95rem;
  }
}

.welcome-logo {
  width: 64px;
  height: 64px;
  opacity: 0.85;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-spacing-lg);
  margin-bottom: var(--app-spacing-xl);
}

.stat-card {
  text-decoration: none;
  color: inherit;
}

@media (max-width: 768px) {
  .stat-grid { grid-template-columns: 1fr; }

  .welcome-banner {
    padding: 24px;
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}
```

**Step 4: Add file replacements to `angular.json`**

Add to both `web` and `web-dev`:
```json
{
  "replace": "src/app/home/home.page.html",
  "with": "src/app/home/home.page.web.html"
},
{
  "replace": "src/app/home/home.page.scss",
  "with": "src/app/home/home.page.web.scss"
}
```

**Step 5: Verify and commit**

---

## Phase 4: List Pages (Web)

### Task 12: Create Web Announcements List Page

**Files:**
- Create: `src/app/pages/announcements/announcements-list.page.web.html`
- Create: `src/app/pages/announcements/announcements-list.page.web.scss`
- Modify: `angular.json`

**Step 1: Read `announcements-list.page.ts`**

Understand all properties: `announcements`, `canCreate`, `apiUrl`, and methods: `getImageUrl()`, `truncateContent()`, `getMentionedNames()`, `getAudienceColor()`, `getAudienceLabel()`, `handleRefresh()`, `onLogout()`.

**Step 2: Create `src/app/pages/announcements/announcements-list.page.web.html`**

Desktop card grid layout. No `ion-*` components. Page header with title + "New Announcement" button (replaces FAB). Cards in a 3-column grid with image, title, content preview, audience badge, author, date.

**Step 3: Create `src/app/pages/announcements/announcements-list.page.web.scss`**

Card grid styling, image thumbnails, hover effects.

**Step 4: Add file replacements and verify build**

---

### Task 13: Create Web Prayer Requests List Page

Same pattern as Task 12. Read `prayer-requests-list.page.ts` first.

**Files:**
- Create: `src/app/pages/prayer-requests/prayer-requests-list.page.web.html`
- Create: `src/app/pages/prayer-requests/prayer-requests-list.page.web.scss`
- Modify: `angular.json`

---

### Task 14: Create Web Worship Lineups List Page

Same pattern. Read `worship-lineups-list.page.ts` first.

**Files:**
- Create: `src/app/pages/worship-lineups/worship-lineups-list.page.web.html`
- Create: `src/app/pages/worship-lineups/worship-lineups-list.page.web.scss`
- Modify: `angular.json`

---

### Task 15: Create Web Youth Profiles List Page

Same pattern. Read `youth-profiles-list.page.ts` first.

**Files:**
- Create: `src/app/pages/youth-profiles/youth-profiles-list.page.web.html`
- Create: `src/app/pages/youth-profiles/youth-profiles-list.page.web.scss`
- Modify: `angular.json`

---

## Phase 5: Form & Detail Pages (Web)

### Task 16: Create Web Announcement Form Page

**Files:**
- Create: `src/app/pages/announcements/announcement-form.page.web.html`
- Create: `src/app/pages/announcements/announcement-form.page.web.scss`
- Modify: `angular.json`

Read `announcement-form.page.ts` for all form fields and methods. Create a centered form layout (max-width 600px) with standard HTML form elements.

---

### Task 17: Create Web Prayer Request Form Page

Same pattern. Read `prayer-request-form.page.ts`.

**Files:**
- Create: `src/app/pages/prayer-requests/prayer-request-form.page.web.html`
- Create: `src/app/pages/prayer-requests/prayer-request-form.page.web.scss` (if needed)
- Modify: `angular.json`

---

### Task 18: Create Web Worship Lineup Form Page

Same pattern. Read `worship-lineup-form.page.ts`.

**Files:**
- Create: `src/app/pages/worship-lineups/worship-lineup-form.page.web.html`
- Create: `src/app/pages/worship-lineups/worship-lineup-form.page.web.scss`
- Modify: `angular.json`

---

### Task 19: Create Web Worship Lineup Detail Page

Side-by-side layout: lineup info on left, members list on right.

**Files:**
- Create: `src/app/pages/worship-lineups/worship-lineup-detail.page.web.html`
- Create: `src/app/pages/worship-lineups/worship-lineup-detail.page.web.scss`
- Modify: `angular.json`

---

### Task 20: Create Web Youth Profile Form Page

**Files:**
- Create: `src/app/pages/youth-profiles/youth-profile-form.page.web.html`
- Create: `src/app/pages/youth-profiles/youth-profile-form.page.web.scss`
- Modify: `angular.json`

---

### Task 21: Create Web Youth Profile Detail Page

**Files:**
- Create: `src/app/pages/youth-profiles/youth-profile-detail.page.web.html`
- Create: `src/app/pages/youth-profiles/youth-profile-detail.page.web.scss`
- Modify: `angular.json`

---

## Phase 6: Admin Panel (Web)

### Task 22: Create Web Admin Page

Horizontal tab bar, wider content, more columns visible.

**Files:**
- Create: `src/app/pages/admin/admin.page.web.html`
- Create: `src/app/pages/admin/admin.page.web.scss`
- Modify: `angular.json`

Read `admin.page.ts` for all properties/methods: `activeTab`, `pendingUsers`, `allUsers`, `pendingProfileChanges`, `pendingPrayerRequests`, `stations`, `availableRoles`, and all action methods.

---

## Phase 7: Profile & Notifications (Web)

### Task 23: Create Web Profile Page

Centered card layout, wider form.

**Files:**
- Create: `src/app/pages/profile/profile.page.web.html`
- Create: `src/app/pages/profile/profile.page.web.scss`
- Modify: `angular.json`

---

### Task 24: Create Web Notifications Page

Wide list layout showing more text.

**Files:**
- Create: `src/app/pages/notifications/notifications.page.web.html`
- Create: `src/app/pages/notifications/notifications.page.web.scss`
- Modify: `angular.json`

---

## Phase 8: Final Verification

### Task 25: Full Build Verification

**Step 1: Mobile build**

Run: `npx ng build --configuration=development`
Expected: Succeeds, all mobile templates used.

**Step 2: Web build**

Run: `npx ng build --configuration=web`
Expected: Succeeds, all web templates used.

**Step 3: Mobile serve test**

Run: `npm run start:mobile`
Test: Navigate all pages, verify Ionic components render correctly.

**Step 4: Web serve test**

Run: `npm run start:web`
Test: Navigate all pages, verify sidebar layout, card grids, forms render correctly.

**Step 5: Final commit**

```bash
git commit -m "feat: complete multi-platform revamp with web desktop layout"
```
