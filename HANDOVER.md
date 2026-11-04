# Rekonekte: handover notes

This file explains what you own, where everything is, and how to run and update the site.

## What is included

| Item | Where |
| --- | --- |
| Complete source code | This repository |
| Automated tests | `tests/Feature/MvpTest.php` |
| Final logo files | `brand/` |
| Database structure | `database/migrations/` |
| Sample data for local testing | `database/seeders/DatabaseSeeder.php` |

The application runs at https://rekonekte.com on your own Namecheap hosting.

## Technology

- Backend: Laravel 13 on PHP 8.4
- Database: MySQL
- Frontend: React 18, built with Vite and served by Laravel
- Sign-in: Laravel Sanctum with session cookies
- Email: sent through the hosting server, signed with DKIM, with SPF and DMARC records in Namecheap

## Run it locally

You need PHP 8.3+, Composer, Node 20+ and MySQL or SQLite.

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
php artisan serve
```

Run the tests with `php artisan test`.

## Update the live site

1. Build the frontend with `npm run build`.
2. Upload the changed files to `~/rekonekte-app` on the server over SSH.
3. Copy `public/build` to `~/public_html/build`, and any new files from `public/img` to `~/public_html/img`.
4. Run `php artisan migrate --force`, `php artisan optimize:clear` and `php artisan config:cache`.

Do not run `php artisan route:cache`. The `/api/health` route is a closure and that command fails on it.

Check the site afterwards at https://rekonekte.com/api/health.

## Before public launch

- Change or remove the shared demo member accounts. They use a shared test password.
- Change the admin password again once handover is complete.
- Remove the sample members, posts and events if you do not want them public.
- Replace the placeholder text on the Privacy Policy and Terms of Service pages with your final text in `resources/js/pages/Legal.jsx`.
- Approve the French, Haitian Creole and Spanish text in `resources/js/phrases.js` and `resources/js/i18n.jsx`.
- Renew the SSL certificate before May 2027, or enable Namecheap AutoSSL.
- Remove the developer's SSH key from cPanel once handover is complete, if you no longer want the developer to have server access.

## Outside the MVP

Google and Apple sign-in, ticket payments, real-time chat, paid memberships, the Host Program, live streaming and native mobile apps are not part of this MVP.
