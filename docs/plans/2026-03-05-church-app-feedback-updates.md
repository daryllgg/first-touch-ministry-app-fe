# Church App Feedback Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all user feedback covering announcements display/mentions, in-app notifications, admin panel overhaul, worship lineup form improvements, branding/theming, and general UI polish.

**Architecture:** Changes span both `church-app-api` (NestJS backend) and `church-app-ui` (Angular/Ionic frontend). Backend changes add mention support, DB-persisted notifications across all modules, updated instrument roles, and admin user management endpoints. Frontend changes overhaul the admin panel with sub-menus, improve announcement display with mentions, redesign the lineup form, update branding to FTM logo colors, and add profile pictures to the navigation menu.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Angular 18, Ionic 8, Capacitor 6, SCSS

---

## Phase 1: Foundation — Branding, Logos & Typography

### Task 1: Copy FTM Logo Assets into Project

**Files:**
- Copy from: `/Users/daryll/Downloads/FTM Logo/` (all 6 files)
- Copy to: `church-app-ui/src/assets/logos/`

**Step 1: Create assets directory and copy logos**

```bash
mkdir -p /Users/daryll/Projects/church-app-ui/src/assets/logos
cp "/Users/daryll/Downloads/FTM Logo/FTM Logo_colored.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
cp "/Users/daryll/Downloads/FTM Logo/FTM Logo_colored_with tagline.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
cp "/Users/daryll/Downloads/FTM Logo/FTM Logo_black.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
cp "/Users/daryll/Downloads/FTM Logo/FTM Logo_black_with tagline.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
cp "/Users/daryll/Downloads/FTM Logo/FTM Logomark.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
cp "/Users/daryll/Downloads/FTM Logo/FTM Wordmark.png" /Users/daryll/Projects/church-app-ui/src/assets/logos/
```

**Step 2: Commit**

```bash
cd /Users/daryll/Projects/church-app-ui
git add src/assets/logos/
git commit -m "chore: add FTM logo assets"
```

---

### Task 2: Update Theme Colors to Match FTM Logo Branding

The FTM logo uses:
- **Dark teal** (for "FirstTouch" text): `#1a3a4a` — use as secondary/dark
- **Olive/lime green** (for flame and "MINISTRY"): `#6d8b25` — use as primary
- **Bright green** (flame highlight): `#8bb42a` — use as primary tint

**Files:**
- Modify: `church-app-ui/src/theme/variables.scss`

**Step 1: Update variables.scss**

Replace the entire `:root` block with updated FTM branding colors:

```scss
:root {
  /** primary — FTM olive/lime green from logo **/
  --ion-color-primary: #6d8b25;
  --ion-color-primary-rgb: 109, 139, 37;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #5c7620;
  --ion-color-primary-tint: #8bb42a;

  /** secondary — FTM dark teal from "FirstTouch" text **/
  --ion-color-secondary: #1a3a4a;
  --ion-color-secondary-rgb: 26, 58, 74;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #163340;
  --ion-color-secondary-tint: #2e4d5c;

  /** tertiary — medium teal **/
  --ion-color-tertiary: #2e6b4f;
  --ion-color-tertiary-rgb: 46, 107, 79;
  --ion-color-tertiary-contrast: #ffffff;
  --ion-color-tertiary-contrast-rgb: 255, 255, 255;
  --ion-color-tertiary-shade: #275e45;
  --ion-color-tertiary-tint: #437a61;

  /** success **/
  --ion-color-success: #16a34a;
  --ion-color-success-rgb: 22, 163, 74;
  --ion-color-success-contrast: #ffffff;
  --ion-color-success-contrast-rgb: 255, 255, 255;
  --ion-color-success-shade: #15803d;
  --ion-color-success-tint: #22c55e;

  /** warning **/
  --ion-color-warning: #F9A825;
  --ion-color-warning-rgb: 249, 168, 37;
  --ion-color-warning-contrast: #000000;
  --ion-color-warning-contrast-rgb: 0, 0, 0;
  --ion-color-warning-shade: #DB9421;
  --ion-color-warning-tint: #FAB13B;

  /** danger **/
  --ion-color-danger: #D32F2F;
  --ion-color-danger-rgb: 211, 47, 47;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-danger-contrast-rgb: 255, 255, 255;
  --ion-color-danger-shade: #BA2929;
  --ion-color-danger-tint: #D84444;

  /** dark — FTM dark teal **/
  --ion-color-dark: #1a3a4a;
  --ion-color-dark-rgb: 26, 58, 74;
  --ion-color-dark-contrast: #ffffff;
  --ion-color-dark-contrast-rgb: 255, 255, 255;
  --ion-color-dark-shade: #163340;
  --ion-color-dark-tint: #2e4d5c;

  /** medium **/
  --ion-color-medium: #4b5563;
  --ion-color-medium-rgb: 75, 85, 99;
  --ion-color-medium-contrast: #ffffff;
  --ion-color-medium-contrast-rgb: 255, 255, 255;
  --ion-color-medium-shade: #374151;
  --ion-color-medium-tint: #6b7280;

  /** light **/
  --ion-color-light: #f5f7f0;
  --ion-color-light-rgb: 245, 247, 240;
  --ion-color-light-contrast: #1a3a4a;
  --ion-color-light-contrast-rgb: 26, 58, 74;
  --ion-color-light-shade: #e8ebe2;
  --ion-color-light-tint: #f9faf6;

  /** Global background **/
  --ion-background-color: #f9fafb;
  --ion-background-color-rgb: 249, 250, 251;

  /** Toolbar **/
  --ion-toolbar-background: #ffffff;
  --ion-toolbar-color: #1a3a4a;

  /** Card **/
  --ion-card-background: #ffffff;
}
```

**Step 2: Update all hardcoded color references in styles.scss**

In `church-app-ui/src/styles.scss`, update the `box-shadow` colors from `rgba(20, 92, 45, ...)` to `rgba(26, 58, 74, ...)` to match the new teal branding. Also update `.active-menu-item` in `app.component.ts`.

**Step 3: Commit**

```bash
git add src/theme/variables.scss src/styles.scss
git commit -m "feat: update theme colors to match FTM logo branding"
```

---

### Task 3: Update Typography — Add Serif Font for Headings

The FTM logo uses a classic serif font. Use **Playfair Display** for headings to match the logo aesthetic, keep **Inter** for body text.

**Files:**
- Modify: `church-app-ui/src/styles.scss`

**Step 1: Add Playfair Display import and update heading styles**

At the top of `styles.scss`, add the Playfair Display import alongside Inter:

```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
```

Update the heading styles:

```scss
h1, h2, h3, h4, h5, h6,
ion-title,
ion-card-title {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ion-color-dark);
}
```

Body text remains Inter (already set via `*` selector).

**Step 2: Update `.app-branding h1` to use the serif font**

The `.app-branding` in styles.scss should inherit the serif font naturally from the h1 rule.

**Step 3: Commit**

```bash
git add src/styles.scss
git commit -m "feat: add Playfair Display serif font for headings"
```

---

### Task 4: Apply FTM Logo to Login Page, Menu Header, and Home Page

**Files:**
- Modify: `church-app-ui/src/app/pages/login/login.page.html`
- Modify: `church-app-ui/src/app/pages/login/login.page.scss`
- Modify: `church-app-ui/src/app/app.component.ts` (menu header)
- Modify: `church-app-ui/src/app/home/home.page.html`
- Modify: `church-app-ui/src/styles.scss` (branding class)

**Step 1: Update login page to use logo**

In `login.page.html`, replace the text branding with the logo image:

```html
<div class="app-branding">
  <img src="assets/logos/FTM Logo_colored.png" alt="First Touch Ministry" class="login-logo" />
</div>
```

In `login.page.scss`, add:

```scss
.login-logo {
  width: 240px;
  max-width: 80%;
  height: auto;
  margin: 0 auto 8px;
  display: block;
}
```

**Step 2: Update menu header to show logomark**

In `app.component.ts`, update the menu header section:

```html
<ion-header>
  <ion-toolbar color="primary">
    <div class="menu-header-content">
      <img src="assets/logos/FTM Logomark.png" alt="FTM" class="menu-logo" />
      <span class="menu-app-name">First Touch Ministry</span>
    </div>
  </ion-toolbar>
</ion-header>
```

And the corresponding styles:

```scss
.menu-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;

  .menu-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .menu-app-name {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 600;
    color: white;
  }
}
```

**Step 3: Update home page title to show logo**

In `home.page.html`, update the toolbar title or add a small logo alongside "FTM App":

```html
<ion-title>
  <img src="assets/logos/FTM Logomark.png" alt="FTM" style="height: 28px; vertical-align: middle; margin-right: 6px;" />
  FTM App
</ion-title>
```

**Step 4: Commit**

```bash
git add src/app/pages/login/ src/app/app.component.ts src/app/home/ src/styles.scss
git commit -m "feat: apply FTM logos to login, menu, and home pages"
```

---

### Task 5: Show Profile Picture in Menu Instead of Icon

**Files:**
- Modify: `church-app-ui/src/app/app.component.ts` (template + styles)

**Step 1: Update the menu user info section**

Replace the `<ion-icon name="person-circle-outline">` in the menu-user-info div with a conditional profile picture:

```html
<div class="menu-user-info">
  @if (currentUser.profilePicture) {
    <img [src]="apiUrl + '/uploads/' + currentUser.profilePicture" alt="Profile" class="menu-profile-pic" />
  } @else {
    <ion-icon name="person-circle-outline"></ion-icon>
  }
  <p class="menu-user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</p>
  <p class="menu-user-email">{{ currentUser.email }}</p>
</div>
```

Add the `apiUrl` property to the component class:

```typescript
apiUrl = environment.apiUrl;
```

And import `environment`:

```typescript
import { environment } from '../environments/environment';
```

**Step 2: Add profile picture styles**

```scss
.menu-profile-pic {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}
```

**Step 3: Commit**

```bash
git add src/app/app.component.ts
git commit -m "feat: show profile picture in navigation menu"
```

---

## Phase 2: Backend — Notifications, Mentions, User Management & Instrument Roles

### Task 6: Add DB Notifications to Announcements Service (Backend)

Currently announcements only send WebSocket events. Add DB-persisted notifications.

**Files:**
- Modify: `church-app-api/src/announcements/announcements.service.ts`
- Modify: `church-app-api/src/announcements/announcements.module.ts`

**Step 1: Inject NotificationsService into AnnouncementsService**

Add `NotificationsService` as an `@Optional()` dependency and call `createForMultipleUsers` after saving an announcement:

```typescript
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification-type.enum';

// In constructor:
@Optional() private notificationsService?: NotificationsService,

// In create() method, after the websocket block:
if (this.notificationsService) {
  try {
    const targetUserIds = targetUsers
      .filter(u => u.id !== author.id)
      .map(u => u.id);
    if (targetUserIds.length > 0) {
      await this.notificationsService.createForMultipleUsers(
        targetUserIds,
        NotificationType.ANNOUNCEMENT,
        `New Announcement: ${saved.title}`,
        saved.content.substring(0, 100) + (saved.content.length > 100 ? '...' : ''),
        saved.id,
        'announcement',
      );
    }
  } catch {
    // Best-effort
  }
}
```

**Step 2: Update AnnouncementsModule to import NotificationsModule**

In `announcements.module.ts`, add `NotificationsModule` to imports (use `forwardRef` if needed to avoid circular deps).

**Step 3: Commit**

```bash
cd /Users/daryll/Projects/church-app-api
git add src/announcements/
git commit -m "feat: create DB notifications when announcements are posted"
```

---

### Task 7: Add @mention Support to Announcements (Backend)

**Files:**
- Modify: `church-app-api/src/announcements/entities/announcement.entity.ts` — add `mentionedUsers` relation
- Modify: `church-app-api/src/announcements/dto/create-announcement.dto.ts` — add `mentionedUserIds` field
- Modify: `church-app-api/src/announcements/announcements.service.ts` — process mentions and notify
- Create: `church-app-api/src/notifications/entities/notification-type.enum.ts` — add MENTION type if not exists

**Step 1: Add mentionedUsers to Announcement entity**

```typescript
// In announcement.entity.ts, add:
import { ManyToMany, JoinTable } from 'typeorm';

@ManyToMany(() => User, { eager: true })
@JoinTable()
mentionedUsers: User[];
```

**Step 2: Add mentionedUserIds to CreateAnnouncementDto**

```typescript
// In create-announcement.dto.ts, add:
import { IsOptional, IsArray, IsUUID } from 'class-validator';

@IsOptional()
@IsArray()
@IsUUID('4', { each: true })
mentionedUserIds?: string[];
```

**Step 3: Process mentions in AnnouncementsService.create()**

After saving the announcement, load mentioned users, link them, and create notifications:

```typescript
// In create() method, after save:
if (dto.mentionedUserIds && dto.mentionedUserIds.length > 0 && this.usersService) {
  const mentionedUsers = [];
  for (const userId of dto.mentionedUserIds) {
    const user = await this.usersService.findById(userId);
    if (user) mentionedUsers.push(user);
  }
  saved.mentionedUsers = mentionedUsers;
  await this.announcementsRepo.save(saved);

  // Create notification for each mentioned user
  if (this.notificationsService) {
    const mentionedIds = mentionedUsers.map(u => u.id).filter(id => id !== author.id);
    if (mentionedIds.length > 0) {
      await this.notificationsService.createForMultipleUsers(
        mentionedIds,
        NotificationType.ANNOUNCEMENT,
        `You were mentioned in: ${saved.title}`,
        `${author.firstName} ${author.lastName} mentioned you in an announcement.`,
        saved.id,
        'announcement',
      );
    }
  }
}
```

Note: The `mentionedUserIds` will come as a JSON string in FormData (since announcements use multipart/form-data). The controller needs to parse it. Update the controller to handle this:

```typescript
// In announcements.controller.ts create() method:
if (typeof dto.mentionedUserIds === 'string') {
  dto.mentionedUserIds = JSON.parse(dto.mentionedUserIds);
}
```

**Step 4: Commit**

```bash
git add src/announcements/ src/notifications/
git commit -m "feat: add @mention support to announcements with notifications"
```

---

### Task 8: Add DB Notifications to Worship Lineups Service (Backend)

**Files:**
- Modify: `church-app-api/src/worship-lineups/worship-lineups.service.ts`
- Modify: `church-app-api/src/worship-lineups/worship-lineups.module.ts`

**Step 1: Inject NotificationsService**

```typescript
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification-type.enum';

// In constructor:
@Optional() private notificationsService?: NotificationsService,
```

**Step 2: Add notifications for lineup events**

Add notification creation at key points:

1. **Lineup submitted** → notify users with WORSHIP_TEAM_HEAD role
2. **Lineup approved** → notify submitter
3. **Lineup rejected** → notify submitter
4. **Lineup changes requested** → notify submitter
5. **Substitution requested** → notify WORSHIP_TEAM_HEAD users
6. **Substitution approved/rejected** → notify requester

For each case, call `createForUser` or `createForMultipleUsers` with the appropriate `NotificationType`.

Example for lineup creation:

```typescript
// In create() after saving lineup:
if (this.notificationsService && this.usersService) {
  const allUsers = await this.usersService.findAll();
  const teamHeads = allUsers.filter(u =>
    u.roles?.some(r => r.name === 'WORSHIP_TEAM_HEAD' || r.name === 'ADMIN' || r.name === 'SUPER_ADMIN')
  );
  const headIds = teamHeads.map(u => u.id).filter(id => id !== submittedBy.id);
  if (headIds.length > 0) {
    await this.notificationsService.createForMultipleUsers(
      headIds,
      NotificationType.LINEUP_SUBMITTED,
      'New Worship Lineup Submitted',
      `${submittedBy.firstName} ${submittedBy.lastName} submitted a lineup for review.`,
      saved.id,
      'worship-lineup',
    );
  }
}
```

Example for status update:

```typescript
// In updateStatus() after saving:
if (this.notificationsService) {
  const type = status === 'APPROVED'
    ? NotificationType.LINEUP_APPROVED
    : NotificationType.LINEUP_REJECTED;
  const title = status === 'APPROVED'
    ? 'Worship Lineup Approved'
    : 'Worship Lineup Rejected';
  await this.notificationsService.createForUser(
    lineup.submittedBy.id,
    type,
    title,
    `Your worship lineup has been ${status.toLowerCase()}.`,
    lineup.id,
    'worship-lineup',
  );
}
```

Similarly for `requestChanges()`, `createSubstitutionRequest()`, and `updateSubstitutionStatus()`.

**Step 3: Update WorshipLineupsModule to import NotificationsModule**

**Step 4: Commit**

```bash
git add src/worship-lineups/ src/notifications/
git commit -m "feat: add DB notifications for worship lineup events"
```

---

### Task 9: Add DB Notifications to User Management (Backend)

**Files:**
- Modify: `church-app-api/src/users/users.service.ts`
- Modify: `church-app-api/src/users/users.module.ts`

**Step 1: Inject NotificationsService into UsersService**

**Step 2: Add notifications for:**

1. **User approved** → notify the user (NotificationType.USER_APPROVED)
2. **Profile change approved** → notify the user (NotificationType.PROFILE_CHANGE_APPROVED)
3. **Profile change rejected** → notify the user (NotificationType.PROFILE_CHANGE_REJECTED)
4. **Profile change requested** → notify admins (NotificationType.PROFILE_CHANGE_REQUESTED)

```typescript
// In approveUser():
if (this.notificationsService) {
  await this.notificationsService.createForUser(
    userId,
    NotificationType.USER_APPROVED,
    'Account Approved',
    'Your account has been approved! You can now access all features.',
    userId,
    'user',
  );
}

// In approveProfileChange():
if (this.notificationsService) {
  await this.notificationsService.createForUser(
    request.user.id,
    NotificationType.PROFILE_CHANGE_APPROVED,
    'Profile Change Approved',
    'Your profile change request has been approved.',
    request.id,
    'profile-change',
  );
}

// In rejectProfileChange():
if (this.notificationsService) {
  await this.notificationsService.createForUser(
    request.user.id,
    NotificationType.PROFILE_CHANGE_REJECTED,
    'Profile Change Rejected',
    'Your profile change request has been rejected.',
    request.id,
    'profile-change',
  );
}
```

**Step 3: Commit**

```bash
git add src/users/
git commit -m "feat: add DB notifications for user management events"
```

---

### Task 10: Add Admin User Management Endpoints (Backend)

**Files:**
- Modify: `church-app-api/src/users/users.controller.ts` — add delete user, create user endpoints
- Modify: `church-app-api/src/users/users.service.ts` — add deleteUser, createUser methods
- Create: `church-app-api/src/users/dto/create-user.dto.ts`

**Step 1: Create CreateUserDto**

```typescript
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsArray()
  roles?: string[];
}
```

**Step 2: Add createUserByAdmin and deleteUser to UsersService**

```typescript
async createUserByAdmin(dto: CreateUserDto): Promise<User> {
  const hash = await bcrypt.hash(dto.password, 10);
  const user = this.usersRepo.create({
    email: dto.email.toLowerCase().trim(),
    passwordHash: hash,
    firstName: dto.firstName,
    lastName: dto.lastName,
    contactNumber: dto.contactNumber,
    isApproved: true,  // Admin-created users are auto-approved
  });
  const saved = await this.usersRepo.save(user);

  if (dto.roles) {
    for (const roleName of dto.roles) {
      await this.assignRole(saved.id, roleName);
    }
  }

  return this.findById(saved.id);
}

async deleteUser(userId: string): Promise<void> {
  const user = await this.findById(userId);
  if (!user) throw new NotFoundException('User not found');
  await this.usersRepo.remove(user);
}
```

**Step 3: Add controller endpoints**

```typescript
@Post()
@UseGuards(JwtAuthGuard, ApprovedGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
createUser(@Body() dto: CreateUserDto) {
  return this.usersService.createUserByAdmin(dto);
}

@Delete(':id')
@UseGuards(JwtAuthGuard, ApprovedGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
deleteUser(@Param('id') id: string) {
  return this.usersService.deleteUser(id);
}
```

**Step 4: Commit**

```bash
git add src/users/
git commit -m "feat: add admin create user and delete user endpoints"
```

---

### Task 11: Add Users-by-Role Endpoint (Backend)

For the worship lineup form to filter users by role (e.g., only singers for singer dropdown).

**Files:**
- Modify: `church-app-api/src/users/users.controller.ts`
- Modify: `church-app-api/src/users/users.service.ts`

**Step 1: Add findByRole to UsersService**

```typescript
async findByRoles(roleNames: string[]): Promise<User[]> {
  return this.usersRepo
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.roles', 'role')
    .where('role.name IN (:...roleNames)', { roleNames })
    .andWhere('user.isApproved = :approved', { approved: true })
    .getMany();
}
```

**Step 2: Add controller endpoint**

```typescript
@Get('by-roles')
@UseGuards(JwtAuthGuard, ApprovedGuard)
findByRoles(@Query('roles') roles: string) {
  const roleNames = roles.split(',');
  return this.usersService.findByRoles(roleNames);
}
```

Note: Place this route BEFORE the `:id` route to avoid conflicts.

**Step 3: Commit**

```bash
git add src/users/
git commit -m "feat: add endpoint to filter users by roles"
```

---

### Task 12: Update Instrument Roles Seed Data (Backend)

**Files:**
- Modify: `church-app-api/src/seeds/seed-instrument-roles.ts`

**Step 1: Update seed with new roles**

```typescript
const INSTRUMENT_ROLES = [
  { name: 'Singer', orderIndex: 0 },
  { name: 'Drummer', orderIndex: 1 },
  { name: 'Bassist', orderIndex: 2 },
  { name: 'Acoustic Guitarist', orderIndex: 3 },
  { name: 'Electric Guitarist', orderIndex: 4 },
  { name: 'Rhythm Guitarist', orderIndex: 5 },
  { name: 'Keyboardist', orderIndex: 6 },
  { name: 'Sustain Piano', orderIndex: 7 },
  { name: 'Others', orderIndex: 8 },
];
```

**Step 2: Run the seed**

```bash
cd /Users/daryll/Projects/church-app-api
npx ts-node src/seeds/seed-instrument-roles.ts
```

**Step 3: Commit**

```bash
git add src/seeds/
git commit -m "feat: update instrument roles with detailed positions"
```

---

### Task 13: Add customRoleName Field to LineupMember (Backend)

For "Others" instrument role, allow a custom role name.

**Files:**
- Modify: `church-app-api/src/worship-lineups/entities/lineup-member.entity.ts`
- Modify: `church-app-api/src/worship-lineups/dto/create-worship-lineup.dto.ts`
- Modify: `church-app-api/src/worship-lineups/worship-lineups.service.ts`

**Step 1: Add customRoleName to LineupMember entity**

```typescript
@Column({ nullable: true })
customRoleName: string;
```

**Step 2: Add to DTO**

```typescript
// In LineupMemberDto (inside create-worship-lineup.dto.ts):
@IsOptional()
@IsString()
customRoleName?: string;
```

**Step 3: Use in service create method**

When creating lineup members, pass the `customRoleName` if provided.

**Step 4: Commit**

```bash
git add src/worship-lineups/
git commit -m "feat: add customRoleName for 'Others' instrument role"
```

---

### Task 14: Add Prayer Requests Pending Endpoint for Admin (Backend)

The admin panel needs to show pending prayer requests. Check if the endpoint exists and is accessible.

**Files:**
- Verify: `church-app-api/src/prayer-requests/prayer-requests.controller.ts` — should have `GET /prayer-requests/pending` accessible to ADMIN

The endpoint already exists (`findPending`). Just verify it's guarded with `ADMIN, SUPER_ADMIN, PASTOR` roles.

**Step 1: Verify and fix if needed**

**Step 2: Commit if changes made**

---

## Phase 3: Frontend — Announcements Display & Mentions

### Task 15: Redesign Announcements List to Look Like Proper Announcements

**Files:**
- Modify: `church-app-ui/src/app/pages/announcements/announcements-list.page.html`
- Modify: `church-app-ui/src/app/pages/announcements/announcements-list.page.scss`
- Modify: `church-app-ui/src/app/pages/announcements/announcements-list.page.ts`

**Step 1: Update the HTML template**

Create a more announcement-like layout with:
- Full-width featured image with overlay gradient
- Author avatar + name + date header
- Audience badge positioned over image
- Proper content preview with "Read more"
- Multiple image indicator
- Mentioned users display

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
    <ion-title>Announcements</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  @if (announcements.length === 0) {
    <div class="empty-state">
      <ion-icon name="megaphone-outline"></ion-icon>
      <p>No announcements yet.</p>
    </div>
  } @else {
    @for (a of announcements; track a.id) {
      <div class="announcement-card" (click)="viewAnnouncement(a)">
        @if (a.images && a.images.length > 0) {
          <div class="announcement-image-container">
            <img [src]="getImageUrl(a.images[0])" [alt]="a.title" class="announcement-image" />
            <div class="image-overlay"></div>
            @if (a.images.length > 1) {
              <span class="image-count">+{{ a.images.length - 1 }}</span>
            }
            <ion-badge [color]="getAudienceColor(a.audience)" class="audience-badge">
              {{ getAudienceLabel(a.audience) }}
            </ion-badge>
          </div>
        } @else {
          <div class="announcement-header-bar">
            <ion-badge [color]="getAudienceColor(a.audience)">
              {{ getAudienceLabel(a.audience) }}
            </ion-badge>
          </div>
        }

        <div class="announcement-body">
          <h3 class="announcement-title">{{ a.title }}</h3>
          <p class="announcement-content">{{ truncateContent(a.content) }}</p>

          @if (a.mentionedUsers && a.mentionedUsers.length > 0) {
            <div class="mentioned-users">
              <ion-icon name="at-outline"></ion-icon>
              <span>{{ getMentionedNames(a.mentionedUsers) }}</span>
            </div>
          }

          <div class="announcement-footer">
            <div class="author-info">
              @if (a.author.profilePicture) {
                <img [src]="apiUrl + '/uploads/' + a.author.profilePicture" class="author-avatar" />
              } @else {
                <div class="author-avatar-placeholder">
                  {{ a.author.firstName.charAt(0) }}{{ a.author.lastName.charAt(0) }}
                </div>
              }
              <span class="author-name">{{ a.author.firstName }} {{ a.author.lastName }}</span>
            </div>
            <span class="announcement-date">{{ a.createdAt | date:'MMM d, y' }}</span>
          </div>
        </div>
      </div>
    }
  }

  @if (canCreate) {
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button routerLink="/announcements/new">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  }
</ion-content>
```

**Step 2: Update SCSS**

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;

  ion-icon {
    font-size: 64px;
    color: var(--ion-color-medium);
    margin-bottom: 16px;
  }
}

.announcement-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(26, 58, 74, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;

  &:active {
    transform: scale(0.98);
  }
}

.announcement-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;

  .announcement-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  }

  .image-count {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .audience-badge {
    position: absolute;
    bottom: 12px;
    left: 12px;
  }
}

.announcement-header-bar {
  padding: 16px 16px 0;
}

.announcement-body {
  padding: 16px;
}

.announcement-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0 0 8px;
  line-height: 1.3;
}

.announcement-content {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 12px;
}

.mentioned-users {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ion-color-primary);
  font-size: 0.8rem;
  margin-bottom: 12px;

  ion-icon {
    font-size: 14px;
  }
}

.announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.author-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ion-color-dark);
}

.announcement-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}
```

**Step 3: Update component class**

Add `getMentionedNames` method, add `at-outline` and `megaphone-outline` icons, and add `viewAnnouncement` method:

```typescript
import { atOutline, megaphoneOutline } from 'ionicons/icons';

// In constructor addIcons:
addIcons({ addOutline, atOutline, megaphoneOutline });

getMentionedNames(users: User[]): string {
  if (users.length <= 2) {
    return users.map(u => `${u.firstName} ${u.lastName}`).join(', ');
  }
  return `${users[0].firstName} ${users[0].lastName} and ${users.length - 1} others`;
}

viewAnnouncement(a: Announcement) {
  // For now, could navigate to detail page if one exists
  // Or show a modal with full content
}
```

**Step 4: Fix image URL**

The current `getImageUrl` method builds: `${apiUrl}/uploads/announcement-images/${imagePath}`

But the backend stores images as `announcement-images/filename.ext` in the `images` array. So the URL should be: `${apiUrl}/uploads/${imagePath}` (not double-prefixing).

Check what the API actually returns. If the `images` array contains `announcement-images/filename.ext`, then the URL should be `${apiUrl}/uploads/${imagePath}`.

Update:
```typescript
getImageUrl(imagePath: string): string {
  if (imagePath.startsWith('announcement-images/')) {
    return `${this.apiUrl}/uploads/${imagePath}`;
  }
  return `${this.apiUrl}/uploads/announcement-images/${imagePath}`;
}
```

**Step 5: Commit**

```bash
git add src/app/pages/announcements/
git commit -m "feat: redesign announcements list with proper card layout and fix image URLs"
```

---

### Task 16: Add @mention Feature to Announcement Form (Frontend)

**Files:**
- Modify: `church-app-ui/src/app/pages/announcements/announcement-form.page.ts`
- Modify: `church-app-ui/src/app/pages/announcements/announcement-form.page.html`
- Modify: `church-app-ui/src/app/pages/announcements/announcement-form.page.scss`
- Modify: `church-app-ui/src/app/interfaces/announcement.interface.ts`

**Step 1: Update Announcement interface**

```typescript
export interface Announcement {
  id: string;
  title: string;
  content: string;
  images: string[];
  audience?: string;
  author: User;
  mentionedUsers?: User[];
  createdAt: string;
  updatedAt: string;
}
```

**Step 2: Add user selection for mentions**

In the form component, load all users and add a multi-select for mentions:

```typescript
// Add to component class:
users: User[] = [];

// In constructor or ngOnInit:
this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
  next: (data) => this.users = data,
});

// Add selectedMentions array:
selectedMentions: string[] = [];
```

In the HTML, add a mention selector after the content textarea:

```html
<ion-item>
  <ion-select
    label="Mention People"
    labelPlacement="floating"
    [multiple]="true"
    [(ngModel)]="selectedMentions"
    interface="alert"
  >
    @for (user of users; track user.id) {
      <ion-select-option [value]="user.id">
        {{ user.firstName }} {{ user.lastName }}
      </ion-select-option>
    }
  </ion-select>
</ion-item>
```

Note: Since we're using ReactiveFormsModule, either add `FormsModule` for ngModel or convert to formControl. Easiest: add `FormsModule` to imports and keep `selectedMentions` as a standalone property.

**Step 3: Include mentions in form submission**

```typescript
// In onSubmit():
if (this.selectedMentions.length > 0) {
  formData.append('mentionedUserIds', JSON.stringify(this.selectedMentions));
}
```

**Step 4: Commit**

```bash
git add src/app/pages/announcements/ src/app/interfaces/
git commit -m "feat: add @mention feature to announcement form"
```

---

## Phase 4: Frontend — Admin Panel Overhaul

### Task 17: Restructure Admin Panel with Sub-menu Tabs

**Files:**
- Modify: `church-app-ui/src/app/pages/admin/admin.page.ts`
- Modify: `church-app-ui/src/app/pages/admin/admin.page.html`
- Modify: `church-app-ui/src/app/pages/admin/admin.page.scss`

**Step 1: Add segment/tab navigation**

Use Ionic's `ion-segment` for sub-menus:

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
    <ion-title>Admin Panel</ion-title>
  </ion-toolbar>
  <ion-toolbar>
    <ion-segment [(ngModel)]="activeTab" scrollable="true">
      <ion-segment-button value="accounts">
        <ion-label>Accounts</ion-label>
      </ion-segment-button>
      <ion-segment-button value="prayer-requests">
        <ion-label>Prayer Requests</ion-label>
      </ion-segment-button>
      <ion-segment-button value="profile-changes">
        <ion-label>Profile Changes</ion-label>
      </ion-segment-button>
      <ion-segment-button value="settings">
        <ion-label>Settings</ion-label>
      </ion-segment-button>
    </ion-segment>
  </ion-toolbar>
</ion-header>
```

**Step 2: Create tabbed content sections**

Each tab shows its own content:

**Accounts tab:**
- Pending users with approve button
- All users list with profile pictures, role badges
- Add User button (opens modal/alert)
- Remove User button per user

**Prayer Requests tab:**
- Pending prayer requests with approve/reject buttons
- Load from prayer-requests service

**Profile Changes tab:**
- Existing pending profile changes section

**Settings tab:**
- Stations management (list, add, remove)

**Step 3: Add to component class**

```typescript
activeTab = 'accounts';
pendingPrayerRequests: any[] = [];
stations: any[] = [];

// Add PrayerRequestsService and YouthProfilesService
constructor(
  private http: HttpClient,
  private profileService: ProfileService,
  private toastCtrl: ToastController,
  private alertCtrl: AlertController,
) {}

// Load methods for each tab
loadPendingPrayerRequests() {
  this.http.get<any[]>(`${this.apiUrl}/prayer-requests/pending`).subscribe({
    next: (data) => this.pendingPrayerRequests = data,
  });
}

loadStations() {
  this.http.get<any[]>(`${this.apiUrl}/youth-profiles/stations`).subscribe({
    next: (data) => this.stations = data,
  });
}
```

**Step 4: Add user management methods**

```typescript
async openAddUserModal() {
  const alert = await this.alertCtrl.create({
    header: 'Add User',
    inputs: [
      { name: 'email', type: 'email', placeholder: 'Email' },
      { name: 'password', type: 'password', placeholder: 'Password' },
      { name: 'firstName', type: 'text', placeholder: 'First Name' },
      { name: 'lastName', type: 'text', placeholder: 'Last Name' },
    ],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Create',
        handler: (data) => {
          this.http.post(`${this.apiUrl}/users`, data).subscribe({
            next: async () => {
              const toast = await this.toastCtrl.create({
                message: 'User created successfully',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
              this.loadAllUsers();
            },
            error: async () => {
              const toast = await this.toastCtrl.create({
                message: 'Failed to create user',
                duration: 3000,
                color: 'danger',
              });
              await toast.present();
            },
          });
        },
      },
    ],
  });
  await alert.present();
}

async confirmDeleteUser(user: User) {
  const alert = await this.alertCtrl.create({
    header: 'Remove User',
    message: `Are you sure you want to remove ${user.firstName} ${user.lastName}? This cannot be undone.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Remove',
        role: 'destructive',
        handler: () => {
          this.http.delete(`${this.apiUrl}/users/${user.id}`).subscribe({
            next: async () => {
              const toast = await this.toastCtrl.create({
                message: 'User removed',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
              this.loadAllUsers();
            },
          });
        },
      },
    ],
  });
  await alert.present();
}
```

**Step 5: Add station management methods**

```typescript
async addStation() {
  const alert = await this.alertCtrl.create({
    header: 'Add Station',
    inputs: [{ name: 'name', type: 'text', placeholder: 'Station Name' }],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Add',
        handler: (data) => {
          this.http.post(`${this.apiUrl}/youth-profiles/stations`, { name: data.name }).subscribe({
            next: async () => {
              const toast = await this.toastCtrl.create({ message: 'Station added', duration: 2000, color: 'success' });
              await toast.present();
              this.loadStations();
            },
          });
        },
      },
    ],
  });
  await alert.present();
}

async confirmDeleteStation(station: any) {
  const alert = await this.alertCtrl.create({
    header: 'Remove Station',
    message: `Remove "${station.name}"?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Remove',
        role: 'destructive',
        handler: () => {
          this.http.delete(`${this.apiUrl}/youth-profiles/stations/${station.id}`).subscribe({
            next: async () => {
              const toast = await this.toastCtrl.create({ message: 'Station removed', duration: 2000, color: 'success' });
              await toast.present();
              this.loadStations();
            },
          });
        },
      },
    ],
  });
  await alert.present();
}
```

**Step 6: Show profile pictures in user list**

In the all users section:

```html
<ion-item>
  <ion-avatar slot="start">
    @if (user.profilePicture) {
      <img [src]="apiUrl + '/uploads/' + user.profilePicture" />
    } @else {
      <div class="avatar-placeholder">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</div>
    }
  </ion-avatar>
  <ion-label>
    <h3>{{ user.firstName }} {{ user.lastName }}</h3>
    <p>{{ user.email }}</p>
    <p>
      @for (role of user.roles; track role.id) {
        <ion-badge color="medium" class="role-badge">{{ role.name }}</ion-badge>
      }
    </p>
  </ion-label>
  <!-- action buttons -->
</ion-item>
```

Add Ionic `IonAvatar`, `IonSegment`, `IonSegmentButton` imports.

**Step 7: Commit**

```bash
git add src/app/pages/admin/
git commit -m "feat: overhaul admin panel with sub-menu tabs and user/station management"
```

---

## Phase 5: Frontend — Worship Lineup Form Improvements

### Task 18: Redesign Worship Lineup Form

**Files:**
- Modify: `church-app-ui/src/app/pages/worship-lineups/worship-lineup-form.page.ts`
- Modify: `church-app-ui/src/app/pages/worship-lineups/worship-lineup-form.page.html`
- Modify: `church-app-ui/src/app/pages/worship-lineups/worship-lineup-form.page.scss`
- Modify: `church-app-ui/src/app/services/worship-lineups.service.ts`

**Step 1: Move Notes to the bottom of the form**

In the HTML template, move the `<ion-item>` with `formControlName="notes"` to after the Members section, just before the submit button.

**Step 2: Update song layout — title and link on separate rows**

```html
<div class="song-row" [formGroupName]="i">
  <div class="song-fields">
    <ion-item class="song-input-full">
      <ion-input formControlName="title" label="Song Title" labelPlacement="floating"></ion-input>
    </ion-item>
    <ion-item class="song-input-full">
      <ion-input formControlName="link" label="Link (optional)" labelPlacement="floating" type="url"></ion-input>
    </ion-item>
    <ion-item class="song-input-full">
      <ion-select formControlName="singerId" label="Singer" labelPlacement="floating" interface="action-sheet">
        @for (u of singerUsers; track u.id) {
          <ion-select-option [value]="u.id">{{ u.firstName }} {{ u.lastName }}</ion-select-option>
        }
      </ion-select>
    </ion-item>
  </div>
  <ion-button fill="clear" color="danger" (click)="removeSong(i)" class="remove-btn">
    <ion-icon name="trash-outline"></ion-icon>
  </ion-button>
</div>
```

**Step 3: Filter singer dropdown to only SINGER role users**

```typescript
singerUsers: User[] = [];

// In ngOnInit, after loading users:
this.http.get<User[]>(`${environment.apiUrl}/users/by-roles?roles=SINGER`).subscribe({
  next: (data) => this.singerUsers = data,
});
```

**Step 4: Update instrument roles and member filtering**

Define the role mapping:

```typescript
private instrumentRoleToUserRoles: Record<string, string[]> = {
  'Singer': ['SINGER'],
  'Drummer': ['DRUMMER'],
  'Bassist': ['BASSIST'],
  'Acoustic Guitarist': ['GUITARIST'],
  'Electric Guitarist': ['GUITARIST'],
  'Rhythm Guitarist': ['GUITARIST'],
  'Keyboardist': ['KEYBOARDIST'],
  'Sustain Piano': ['KEYBOARDIST'],
  'Others': ['WORSHIP_LEADER', 'WORSHIP_TEAM_HEAD', 'GUITARIST', 'KEYBOARDIST', 'DRUMMER', 'BASSIST', 'SINGER'],
};

// Cache users by role
usersByRole: Record<string, User[]> = {};

// In ngOnInit, load users grouped by role:
this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
  next: (data) => {
    this.users = data;
    // Pre-filter users by role
    const roleGroups: Record<string, User[]> = {};
    for (const [instrRole, userRoles] of Object.entries(this.instrumentRoleToUserRoles)) {
      roleGroups[instrRole] = data.filter(u =>
        u.roles?.some(r => userRoles.includes(r.name))
      );
    }
    this.usersByRole = roleGroups;
  },
});

// Method to get filtered users for a member row
getUsersForRole(instrumentRoleName: string): User[] {
  return this.usersByRole[instrumentRoleName] || this.users;
}
```

**Step 5: Update member row template for role-based filtering**

When the instrument role changes, the user dropdown updates:

```html
<div class="member-row" [formGroupName]="i">
  <ion-item class="member-role-select">
    <ion-select formControlName="instrumentRoleId" label="Role"
      labelPlacement="floating" interface="action-sheet"
      (ionChange)="onInstrumentRoleChange(i)">
      @for (role of instrumentRoles; track role.id) {
        <ion-select-option [value]="role.id">{{ role.name }}</ion-select-option>
      }
    </ion-select>
  </ion-item>

  @if (getSelectedRoleName(i) === 'Others') {
    <ion-item class="member-custom-role">
      <ion-input formControlName="customRoleName" label="Custom Role" labelPlacement="floating"></ion-input>
    </ion-item>
  }

  <ion-item class="member-user-select">
    <ion-select formControlName="userId" label="Member"
      labelPlacement="floating" interface="action-sheet">
      @for (u of getFilteredUsersForMember(i); track u.id) {
        <ion-select-option [value]="u.id">{{ u.firstName }} {{ u.lastName }}</ion-select-option>
      }
    </ion-select>
  </ion-item>

  <ion-button fill="clear" color="danger" (click)="removeMember(i)" class="remove-btn">
    <ion-icon name="trash-outline"></ion-icon>
  </ion-button>
</div>
```

**Step 6: Add helper methods**

```typescript
getSelectedRoleName(memberIndex: number): string {
  const roleId = this.members.at(memberIndex).get('instrumentRoleId')?.value;
  const role = this.instrumentRoles.find(r => r.id === roleId);
  return role?.name || '';
}

getFilteredUsersForMember(memberIndex: number): User[] {
  const roleName = this.getSelectedRoleName(memberIndex);
  return this.getUsersForRole(roleName);
}

onInstrumentRoleChange(memberIndex: number) {
  // Reset userId when role changes
  this.members.at(memberIndex).get('userId')?.setValue('');
}
```

**Step 7: Update addMember to include customRoleName**

```typescript
addMember() {
  this.members.push(this.fb.group({
    userId: ['', [Validators.required]],
    instrumentRoleId: ['', [Validators.required]],
    customRoleName: [''],
  }));
}
```

**Step 8: Update onSubmit to include customRoleName**

```typescript
members: formValue.members.map((m: any) => ({
  userId: m.userId,
  instrumentRoleId: m.instrumentRoleId,
  customRoleName: m.customRoleName || undefined,
})),
```

**Step 9: Update SCSS for better mobile layout**

```scss
.song-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border-left: 3px solid var(--ion-color-primary);

  .song-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .song-input-full {
    width: 100%;
  }

  .remove-btn {
    align-self: flex-start;
    margin-top: 8px;
  }
}

.member-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border-left: 3px solid var(--ion-color-secondary);

  .member-role-select,
  .member-user-select,
  .member-custom-role {
    flex: 1;
    min-width: 140px;
  }

  .remove-btn {
    align-self: flex-start;
    margin-top: 8px;
  }
}

// Mobile: stack member selects vertically
@media (max-width: 576px) {
  .member-row {
    flex-direction: column;

    .member-role-select,
    .member-user-select,
    .member-custom-role {
      width: 100%;
    }

    .remove-btn {
      align-self: flex-end;
    }
  }
}
```

**Step 10: Commit**

```bash
git add src/app/pages/worship-lineups/ src/app/services/worship-lineups.service.ts
git commit -m "feat: redesign worship lineup form with role filtering and improved layout"
```

---

## Phase 6: Frontend — Notifications Cleanup

### Task 19: Update Notifications to Use DB-Only (No WebSocket Required)

The user clarified notifications are DB-persisted only, viewed in the notifications page. Remove the WebSocket dependency for now.

**Files:**
- Modify: `church-app-ui/src/app/services/notifications.service.ts`

**Step 1: Remove socket.io connection**

Keep the HTTP methods, remove the socket connection. Use polling or manual refresh instead:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationsService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private userSub?: Subscription;
  private pollInterval?: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.refreshUnreadCount();
        this.startPolling();
      } else {
        this.stopPolling();
        this.unreadCountSubject.next(0);
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.stopPolling();
  }

  private startPolling() {
    this.stopPolling();
    // Poll every 30 seconds for new notifications
    this.pollInterval = setInterval(() => this.refreshUnreadCount(), 30000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  findAll(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.patch<AppNotification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  refreshUnreadCount() {
    this.getUnreadCount().subscribe({
      next: (count) => this.unreadCountSubject.next(count),
    });
  }
}
```

**Step 2: Remove socket.io-client import**

Remove the `import { io, Socket } from 'socket.io-client';` line.

**Step 3: Update PushNotificationService**

Since we're not doing push notifications yet either, ensure it doesn't break if Firebase isn't configured. Make it a no-op service for now.

**Step 4: Commit**

```bash
git add src/app/services/notifications.service.ts src/app/services/push-notifications.service.ts
git commit -m "feat: simplify notifications to DB-only with polling, remove websocket dependency"
```

---

## Phase 7: Update Active Menu Item Colors & Polish

### Task 20: Update Active Menu Item and Box Shadow Colors

**Files:**
- Modify: `church-app-ui/src/app/app.component.ts` — update active-menu-item colors
- Modify: `church-app-ui/src/styles.scss` — update box-shadow colors

**Step 1: Update active menu item color in app.component.ts**

Change from green (#16a34a, #f0fdf4) to match new FTM primary/secondary:

```scss
.active-menu-item {
  --background: #f5f7f0;
  --color: #6d8b25;
  color: #6d8b25;

  ion-icon {
    color: #6d8b25;
  }
}
```

**Step 2: Update all box-shadow `rgba(20, 92, 45, ...)` to `rgba(26, 58, 74, ...)`**

In `styles.scss`, find-and-replace `rgba(20, 92, 45,` with `rgba(26, 58, 74,`.

**Step 3: Commit**

```bash
git add src/app/app.component.ts src/styles.scss
git commit -m "feat: update active menu and shadow colors to match FTM branding"
```

---

## Phase 8: Context Memory File

### Task 21: Create Project Context Memory File

**Files:**
- Create: `/Users/daryll/.claude/projects/-Users-daryll-Projects/memory/MEMORY.md`

**Step 1: Create the memory file**

```markdown
# Church App - Project Context

## Project: First Touch Ministry (FTM) App
- **API**: `/Users/daryll/Projects/church-app-api` — NestJS 11 + TypeORM + PostgreSQL
- **UI**: `/Users/daryll/Projects/church-app-ui` — Angular 18 + Ionic 8 + Capacitor 6

## Branding
- **Church name**: First Touch Ministry (FTM)
- **Tagline**: "Touching God. Touching People."
- **Primary color**: `#6d8b25` (olive/lime green from logo)
- **Secondary color**: `#1a3a4a` (dark teal from logo text)
- **Heading font**: Playfair Display (serif)
- **Body font**: Inter (sans-serif)
- **Logos**: `church-app-ui/src/assets/logos/`

## User Roles (13 total)
NORMAL_USER, PASTOR, WORSHIP_LEADER, WORSHIP_TEAM_HEAD, GUITARIST, KEYBOARDIST, DRUMMER, BASSIST, SINGER, LEADER, OUTREACH_WORKER, ADMIN, SUPER_ADMIN

## Instrument Roles (Worship Lineup)
Singer, Drummer, Bassist, Acoustic Guitarist, Electric Guitarist, Rhythm Guitarist, Keyboardist, Sustain Piano, Others

## Key Modules
- Auth (JWT, registration approval flow)
- Users (RBAC, profile management, profile change requests)
- Announcements (audience targeting, image uploads, @mentions)
- Prayer Requests (visibility levels, approval workflow)
- Worship Lineups (members, songs, substitutions, approval)
- Notifications (DB-persisted, polling-based, no push/websocket yet)
- Youth Profiles (stations, photos)

## Architecture Notes
- Angular standalone components throughout
- Functional route guards (auth, approved, guest, role)
- HTTP interceptor for JWT token injection
- Notifications: DB-only (no WebSocket/push yet)
- File uploads stored in `/uploads/` with categories
- Admin panel has sub-menu tabs: Accounts, Prayer Requests, Profile Changes, Settings

## Dev Preferences
- Keep notifications simple (DB records + polling)
- Mobile-first design with Ionic
- Use Playfair Display for headings, Inter for body
- Match FTM logo branding colors exactly
```

**Step 2: Commit**

This file is outside the project repos, no git commit needed.

---

## Execution Order Summary

| Phase | Tasks | Scope |
|-------|-------|-------|
| 1. Foundation | Tasks 1-5 | Logos, theme, typography, menu profile pic |
| 2. Backend | Tasks 6-14 | Notifications, mentions, user mgmt, roles |
| 3. Announcements UI | Tasks 15-16 | Display redesign, mentions, image fix |
| 4. Admin Panel UI | Task 17 | Sub-menus, user/station mgmt, profile pics |
| 5. Lineup Form UI | Task 18 | Layout, role filtering, mobile |
| 6. Notifications UI | Task 19 | DB-only, remove websocket |
| 7. Polish | Task 20 | Color consistency |
| 8. Memory | Task 21 | Context file for future sessions |

**Dependencies:**
- Tasks 6-14 (backend) should be done before Tasks 15-19 (frontend) where applicable
- Task 1 must be done before Task 4 (logos must exist before applying)
- Task 2 must be done before Task 20 (theme before polish)
- Task 12 must be done before Task 18 (instrument roles seed before form)
