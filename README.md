# Rekonekte.com — MVP website

**Lanmou · Kominote · Lakay.** A dating and community platform for the Haitian diaspora.

This repository covers **Phase 1 (website MVP)** as described in the signed quotation.
Milestones 1 and 2 are complete. Milestone 3 (final testing, legal text, translations and handover) is in progress.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Laravel 13 (PHP 8.3+) |
| Database | MySQL 8 / MariaDB 10.6+ (SQLite works for local testing) |
| Frontend | React 18 + React Router, built with Vite through `laravel-vite-plugin` |
| Auth | Laravel Sanctum (session cookie) |

Laravel serves one HTML shell (`resources/views/app.blade.php`) and the React app in `resources/js` draws every page. JSON endpoints live under `/api`.

## Milestone 1 — what is included

- **Scope and page structure:** every MVP page exists and is linked: landing page, register (date of birth + 18+ confirmation), email verification, login, password reset, Discover, member profile, messages inbox and conversation, community posts, events, my profile and edit profile with photo upload, settings, admin dashboard, Privacy Policy and Terms of Service, plus a 404 page.
- **Responsive UI:** desktop, tablet and mobile, in the client's brand. That means the client logo, navy, champagne gold and ivory, Cormorant Garamond for headings and Jost for body text.
- **Languages:** EN / FR / HT switcher on the landing page, navigation, footer and app screens. Translations are drafts that the client should approve (`resources/js/phrases.js`, `resources/js/i18n.jsx`).
- **Project and repository setup:** a Laravel application, a git repository, environment configuration and a build pipeline.
- **Registration and login foundation:** working sign-up with the 18+ check on the server, an email verification code, login and logout, and password reset. The Register, Verify, Login and Reset screens are connected to the API.
- **Database and application foundation:** the full MVP schema (see below), Eloquent models with relationships, demo seed data, and the first live endpoint (`GET /api/members` with age, gender and city filters).

### Database schema (`database/migrations/2026_10_23_000100_create_rekonekte_mvp_tables.php`)

| Table | Purpose |
| --- | --- |
| `users` (+ role, date_of_birth, adult_confirmed_at, locale, suspended_at) | Accounts, 18+ confirmation, admin roles, suspension |
| `profiles` | Profile details: gender, city, hometown, bio, languages, interests, verified |
| `photos` | Profile photos (primary + gallery) |
| `likes`, `passes` | Matching: a like in both directions makes a match |
| `conversations`, `messages` | Private, refresh-based messaging |
| `blocks`, `reports` | Safety: block a member; report a user, message or post for admin review |
| `posts` | Community posts with category, city, image, and a moderation status |
| `events`, `event_rsvps` | Events listing, management and RSVPs |

### Registration & login foundation (working, connected to the database)

Session-cookie auth with Laravel Sanctum. The React app and the API are on the same domain.

| Method | Path | |
| --- | --- | --- |
| POST | `/api/register` | Creates the account and profile. The **18+ check runs on the server** (date of birth + confirmation box + terms). Signs the member in and emails a 6-digit verification code |
| POST | `/api/email/verify` | Verifies the email with the code (valid for 15 minutes) |
| POST | `/api/email/resend` | Sends a new code |
| POST | `/api/login` / `/api/logout` | Signs in and out. Suspended accounts are refused |
| GET | `/api/me` | The signed-in member, or null |
| POST | `/api/password/forgot` / `/api/password/reset` | Password reset with an emailed 6-digit code |
| GET | `/api/health` | Checks that the app is up and connected to the database |
| GET | `/api/members?min_age=&max_age=&gender=&city=` | Discover: filtered member list; suspended members are excluded |

Login attempts are rate-limited, and verification and reset codes are stored hashed.

## Deployment note (shared cPanel hosting)

Point the domain's document root at `public/`. If the host's default PHP is older than 8.4, select PHP 8.4 for the domain. On cPanel without MultiPHP you can add `AddHandler application/x-httpd-ea-php84 .php` to `public/.htaccess`. Use `MAIL_MAILER=sendmail` (or SMTP) so the verification and reset codes get delivered.

All app screens read and write the database through the API. Members-only endpoints also require a verified email and an active (not suspended) account, enforced on the server by `app/Http/Middleware/EnsureActiveMember.php`.

## Run it locally

Requirements: PHP 8.3+, Composer, Node 20+, and MySQL (or SQLite).

```bash
composer install
cp .env.example .env            # set DB_DATABASE / DB_USERNAME / DB_PASSWORD
php artisan key:generate
php artisan migrate --seed      # creates the schema + demo data
npm install
npm run build                   # or: npm run dev  (hot reload)
php artisan serve               # http://127.0.0.1:8000
```

Run the automated tests with `php artisan test`. They use an in-memory SQLite database and cover the agreed MVP features through the API (`tests/Feature/MvpTest.php`).

Demo accounts, all with the password `password`:
- **Admin:** `admin@rekonekte.com`
- **Members:** `daniela@example.com`, `nadia@example.com`, `jean@example.com` and others

## Milestones

| # | Milestone | Status |
| --- | --- | --- |
| 1 | Planning, UI/UX & setup | ✅ Delivered |
| 2 | Core website development: accounts, profiles and photos, matching, messaging, safety, community, events management, admin | ✅ Complete |
| 3 | Testing, refinements, legal pages, final language labels, deployment and handover | In progress |

Client to supply: final Privacy Policy and Terms of Service text, and approved FR/HT translations.
