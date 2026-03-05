# Multi-Platform Revamp Design

## Summary

Transform the FTM church app from mobile-only (Ionic/Capacitor) to a multi-platform app supporting Android, iOS, and Web with platform-appropriate UIs. Mobile keeps Ionic components. Web gets a full desktop layout with sidebar navigation, top bar, card grids, and split-screen auth pages.

## Approach: Angular File Replacements

Use Angular's built-in `fileReplacements` in `angular.json` to swap HTML templates and SCSS styles per platform at build time. The TypeScript component logic stays shared — only presentation files get `.web.` variants.

**Why this approach:**
- Native Angular feature, no extra dependencies
- Zero runtime overhead — each build ships only its platform's code
- Clean separation — no `@if (isWeb)` conditionals in templates
- Shared business logic — services, guards, interfaces, routes written once
- Independent evolution — web and mobile can be polished independently

## NPM Scripts

```
npm run start:mobile    → ng serve (current, Ionic/Capacitor)
npm run start:web       → ng serve --configuration=web
npm run build:mobile    → ng build
npm run build:web       → ng build --configuration=web
npm run build:ios       → ng build && npx cap sync ios
npm run build:android   → ng build && npx cap sync android
```

## File Structure

```
src/
├── styles.scss                  ← mobile (existing Ionic imports)
├── styles.web.scss              ← web (no Ionic CSS, custom styles)
├── theme/
│   ├── variables.scss           ← shared design tokens
│   └── variables.web.scss       ← web-specific overrides
├── app/
│   ├── app.component.ts                 ← shared logic
│   ├── app.component.html               ← mobile (bottom tabs + side menu)
│   ├── app.component.web.html           ← web (sidebar + top bar)
│   ├── app.component.scss               ← mobile styles
│   ├── app.component.web.scss           ← web styles
│   ├── home/
│   │   ├── home.page.ts                 ← shared
│   │   ├── home.page.html               ← mobile
│   │   ├── home.page.web.html           ← web (dashboard grid)
│   │   ├── home.page.scss               ← mobile
│   │   └── home.page.web.scss           ← web
│   ├── pages/
│   │   ├── login/
│   │   │   ├── login.page.ts            ← shared
│   │   │   ├── login.page.html          ← mobile
│   │   │   ├── login.page.web.html      ← web (split screen)
│   │   │   └── login.page.web.scss      ← web
│   │   ├── announcements/
│   │   │   ├── announcements-list.page.ts        ← shared
│   │   │   ├── announcements-list.page.html      ← mobile
│   │   │   ├── announcements-list.page.web.html  ← web (card grid)
│   │   │   └── announcements-list.page.web.scss  ← web
│   │   └── ... (same pattern for all page modules)
```

**Rule:** The `.ts` file is always shared. Only `.html` and `.scss` files get `.web.` variants.

## Web App Shell

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [FTM Logo]  First Touch Ministry          🔔 3   [User]│
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  Home      │     <router-outlet>                         │
│  Annc.     │                                             │
│  Prayer    │     (page content renders here)             │
│  Lineup    │                                             │
│  Youth     │                                             │
│  Notif.    │                                             │
│            │                                             │
│  ────────  │                                             │
│  Admin     │                                             │
│  Logout    │                                             │
├────────────┴─────────────────────────────────────────────┤
│  © 2026 First Touch Ministry                             │
└──────────────────────────────────────────────────────────┘
```

### Top Bar
- Left: FTM logo + "First Touch Ministry" text
- Right: Notification bell with unread badge, user avatar + name dropdown (profile, logout)

### Sidebar (240px fixed)
- Nav links with icons, matching current mobile menu items
- Active link: primary color left border + background tint
- Admin Panel: visible only for ADMIN/SUPER_ADMIN
- Logout at bottom
- Sticky, does not scroll with content

### Content Area
- Max-width 1200px, centered with padding
- Standard HTML elements (`<div>`, `<nav>`, `<main>`) — no Ionic shell components

## Page Designs

### Auth Pages (Login, Register, Verify Email) — Split Screen

```
┌──────────────────────┬───────────────────────┐
│                      │                       │
│   [FTM Logo]         │    Login              │
│                      │                       │
│   "Touching God.     │    Email: [________]  │
│    Touching People." │    Pass:  [________]  │
│                      │                       │
│   [gradient bg       │    [  Sign In  ]      │
│    #1a3a4a→#2e5d73]  │                       │
│                      │    Don't have an      │
│                      │    account? Register  │
└──────────────────────┴───────────────────────┘
```

### Home — Dashboard Grid

- Welcome greeting banner
- Summary stat cards (Announcements, Prayer Requests, Notifications) — clickable
- Recent announcements in card grid below

### List Pages (Announcements, Prayer Requests, Lineups, Youth)

- Page title + "New" button (replaces mobile FAB)
- Optional search/filter bar
- Responsive CSS Grid: 3 columns desktop, 2 tablet, 1 narrow
- Cards link to detail/edit views

### Form Pages (Create/Edit)

- Centered form, max-width ~600px
- Standard HTML form elements
- Same fields and validation as mobile

### Detail Pages

- Wider layout using desktop space
- Side-by-side sections where appropriate

### Admin Page

- Horizontal tab bar (Accounts, Prayer Requests, Profile Changes, Settings)
- Wider content layout with more visible columns

### Profile & Notifications

- Centered card layout (profile) / wide list (notifications)

## Web Styling Strategy

- **No Ionic CSS** on web — `styles.web.scss` does not import `@ionic/angular/css/*`
- **Pure custom CSS** using shared design tokens (`--app-spacing-*`, `--app-radius-*`, color variables)
- **CSS Grid** for card layouts, **Flexbox** for sidebar/topbar
- **Same Inter font**, same sizes, same color palette
- **Utility classes:** `.card`, `.btn`, `.sidebar`, `.topbar`, `.form-group`, etc.

### Breakpoints

```scss
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
$breakpoint-wide: 1440px;
```

## What Stays Shared (No Web Variant Needed)

| Category | Shared? | Reason |
|----------|---------|--------|
| All `.ts` component files | Yes | Logic is platform-agnostic |
| All services | Yes | HTTP calls, auth, state |
| All guards | Yes | Route protection |
| All interfaces | Yes | Data models |
| `app.routes.ts` | Yes | Same routes |
| `app.config.ts` | Yes | Same providers |
| `environments/` | Yes | Same API URLs |

## Ionic Imports on Web

Mobile templates use Ionic standalone imports (`IonCard`, `IonButton`, etc.) in the component's `imports` array. Web templates don't reference these. The unused Ionic imports are tree-shaken out by the Angular compiler — no runtime cost on web.

## Rollout Phases

1. **Infrastructure** — Build config, scripts, web global styles, web shell (sidebar + top bar)
2. **Auth pages** — Login, register, verify-email with split-screen layout
3. **Home dashboard** — Web version with stat cards + announcement grid
4. **List pages** — Announcements, prayer requests, lineups, youth with card grids
5. **Form/detail pages** — Wider layouts for create/edit/detail views
6. **Admin panel** — Web-optimized tab layout
7. **Profile & notifications** — Web versions
