# Pledges/Giving Module — Design Document

**Date**: 2026-03-07
**Status**: Approved
**Task**: #8

---

## Overview

A financial tracking module for church giving programs. Tracks pledges, payments, and provides analytics. PIN-protected for privacy — every user (including admins) must enter a PIN before accessing any pledge data.

## Programs

Three program types:

| Type | Behavior | Example |
|------|----------|---------|
| **Seed Faith** | One-time giving | "Seed Faith 2026" |
| **Faith Pledge** | Monthly installments, default 10 months (Feb–Dec), fixed amount, customizable | "Faith Pledge 2026" |
| **Custom** | One-time giving campaigns | "Back to School 2026" |

Programs are created by Admins/Pastors and can be deactivated when complete.

## Access Control

- **Record pledges/payments**: ADMIN, SUPER_ADMIN, PASTOR only
- **View own data**: Any authenticated user (after PIN verification)
- **View analytics**: ADMIN, SUPER_ADMIN, PASTOR only
- **PIN required**: Everyone, no bypass

---

## Data Model

### GivingProgram

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| name | string | "Seed Faith 2026", "Faith Pledge 2026" |
| type | enum | SEED_FAITH, FAITH_PLEDGE, CUSTOM |
| description | string? | Optional |
| startDate | date? | Program start |
| endDate | date? | Program end |
| isActive | boolean | Admin can deactivate |
| createdBy | User (FK) | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Pledge

Links a user to a program with their commitment.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| user | User (FK) | The pledgee |
| program | GivingProgram (FK) | |
| pledgeAmount | decimal | One-time amount or monthly amount |
| totalMonths | int? | Faith Pledge only, default 10 |
| startMonth | date? | Faith Pledge only, default Feb current year |
| notes | string? | |
| createdBy | User (FK) | Admin/Pastor who recorded |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### PledgePayment

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| pledge | Pledge (FK) | |
| amount | decimal | |
| date | date | Payment date |
| month | date? | Which month this covers (Faith Pledge) |
| paymentMethod | enum | CASH, GCASH, BANK_TRANSFER, CHECK, OTHER |
| notes | string? | |
| recordedBy | User (FK) | |
| createdAt | timestamp | |

### UserPin

| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | |
| user | User (FK, unique) | One PIN per user |
| pinHash | string | bcrypt-hashed 4-6 digit PIN |
| failedAttempts | int | Rate limiting counter |
| lockedUntil | timestamp? | Lock after 5 failed attempts (15 min) |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Relationships

- GivingProgram → many Pledges
- Pledge → many PledgePayments
- User → many Pledges (one per program)
- User → one UserPin

---

## API Endpoints

### Giving Programs (Admin/Pastor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/giving-programs` | Create program |
| GET | `/giving-programs` | List all programs |
| GET | `/giving-programs/:id` | Program detail + summary stats |
| PATCH | `/giving-programs/:id` | Update program |
| DELETE | `/giving-programs/:id` | Deactivate (set isActive=false) |

### Pledges (Admin/Pastor write, PIN-protected read)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pledges` | Create pledge (assign user to program) |
| GET | `/pledges?programId=X` | List pledges for program (admin) |
| GET | `/pledges/my` | Current user's pledges (PIN required) |
| GET | `/pledges/:id` | Pledge detail + payment history |
| PATCH | `/pledges/:id` | Update pledge |
| DELETE | `/pledges/:id` | Remove pledge |

### Payments (Admin/Pastor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pledges/:id/payments` | Record payment |
| PATCH | `/pledge-payments/:id` | Update payment |
| DELETE | `/pledge-payments/:id` | Delete payment |

### PIN

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user-pin/setup` | Set PIN (first time) |
| POST | `/user-pin/verify` | Verify PIN → session flag |
| PATCH | `/user-pin/change` | Change PIN (requires current) |

### Analytics (Admin/Pastor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/giving-analytics/summary` | Totals per program |
| GET | `/giving-analytics/trends?year=2026` | Monthly collection totals |
| GET | `/giving-analytics/compliance?programId=X` | Faith Pledge compliance |
| GET | `/giving-analytics/overdue?programId=X` | Delinquent pledgees |

---

## UI Pages

### 1. Pledges Landing (`/pledges`) — PIN Gate

- **No PIN set**: "Set Your PIN" form (4-6 digits + confirm)
- **PIN set**: "Enter PIN" keypad → verifies → shows dashboard
- **Admin/Pastor**: Admin dashboard (programs + analytics tabs)
- **Regular member**: Personal pledges view

### 2. Admin: Programs List (`/pledges/programs`)

Table of all programs: name, type badge, status, total collected, pledgee count. "New Program" button.

### 3. Admin: Program Form (`/pledges/programs/new`, `/pledges/programs/:id/edit`)

Fields: name, type, description, start/end dates. Faith Pledge: default months (10), start month (Feb).

### 4. Admin: Program Detail (`/pledges/programs/:id`)

- Program info card
- Pledgees table: name, pledge amount, total paid, balance, status badge (On Track / Behind / Complete)
- "Add Pledgee" button → modal (select user + pledge amount)
- Click row → payment history + "Record Payment" button

### 5. Admin: Analytics Dashboard (`/pledges/analytics`)

- **Summary cards**: Total collected, per-program totals, compliance rate
- **Monthly trends**: Bar chart (CSS-only, 12 months, per program type)
- **Compliance table**: Pledgee, months paid/due, amount paid/due, status
- **Overdue list**: Name, months behind, amount owed
- **Year-over-year**: Current vs previous year comparison

### 6. Member: My Pledges (on `/pledges` after PIN)

- Cards per enrolled program
- Each card: program name, pledge amount, total paid, remaining balance
- Faith Pledge: progress bar (X of Y months), payment history list

### Sidebar Navigation

"Pledges" menu item with heart/gift icon. Visible to all authenticated users.

---

## PIN Protection Flow

### Setup (first access)

1. Navigate to `/pledges`
2. No PIN exists → "Set Your PIN" screen
3. 4-6 digit input + confirmation
4. bcrypt-hashed, stored in `user_pins` table

### Verification (subsequent)

1. Navigate to `/pledges`
2. "Enter PIN" input
3. `POST /user-pin/verify` → success flag
4. Frontend stores `pinVerified = true` in memory only (clears on refresh/logout)
5. Rate limited: 5 attempts max, 15-minute lockout

### Security

- bcrypt-hashed (same as passwords)
- Memory-only session (no localStorage)
- Admins also need PIN — no bypass
- Lockout after 5 failed attempts

---

## Analytics Specs

### Summary Cards (top row)

- Total collected (all programs, current year)
- Seed Faith total
- Faith Pledge total
- Compliance rate (% of pledgees paid current month)

### Monthly Trends

- CSS bar chart, Jan–Dec
- Stacked/grouped by program type

### Compliance Table

- Columns: Name, Months Paid, Months Due, Amount Paid, Amount Due, Status
- Status badges: Complete, On Track, Behind, New
- Filter by program, sort by status

### Overdue List

- Pledgees with missed Faith Pledge payments
- Columns: Name, Months Behind, Amount Owed
- Sorted by most overdue

### Year-over-Year

- Current year total vs previous year
- Simple comparison cards or overlaid chart
