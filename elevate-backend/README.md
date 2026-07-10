# Elevate Backend

Production-ready backend API for Elevate, a platform focused on reducing youth unemployment in Uganda by connecting verified employers and youth opportunities.

## Project Overview

Elevate serves youth aged 18-30 in Kampala by providing:
- Secure account onboarding for youth and employers
- Verified employer job publishing
- Job discovery and application workflows
- Career resources and bookmarking
- Role-based access for admin moderation and platform operations

## Mission Statement

Elevate helps bridge the employment gap for young people in Uganda through trusted digital infrastructure, mobile-first workflows, and localized data constraints (Kampala divisions, Ugandan phone validation, and low-bandwidth practical APIs).

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Local Setup

1. Clone repository and enter project:

```bash
git clone <your-repo-url>
cd elevate-backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
```

4. Create PostgreSQL database:

```sql
CREATE DATABASE elevate_db;
```

5. Run migrations:

```bash
npm run db:migrate
```

6. Seed sample data:

```bash
npm run db:seed
```

7. Start development server:

```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

## Environment Variables

| Variable | Required | Example | Description |
|---|---|---|---|
| NODE_ENV | Yes | development | Runtime environment |
| PORT | Yes | 5000 | API port |
| DATABASE_URL | Yes | postgresql://postgres:postgres@localhost:5432/elevate_db | PG connection string |
| DB_SSL | Yes | false | Enable SSL for database |
| FRONTEND_URL | Yes | http://localhost:3000 | Allowed CORS origin in production |
| JWT_ACCESS_SECRET | Yes | change_me_access | Access token signing key |
| JWT_REFRESH_SECRET | Yes | change_me_refresh | Refresh token signing key |
| JWT_EMAIL_SECRET | Yes | change_me_email | Email verification token key |
| ACCESS_TOKEN_TTL | Yes | 15m | Access token expiry |
| REFRESH_TOKEN_TTL | Yes | 7d | Refresh token expiry |
| BCRYPT_ROUNDS | Yes | 12 | Password hashing cost |
| COOKIE_SECURE | Yes | false | Secure cookies in HTTPS environments |
| COOKIE_DOMAIN | No | .example.com | Cookie domain scope |
| SMTP_HOST | No | smtp.mailtrap.io | SMTP host |
| SMTP_PORT | No | 587 | SMTP port |
| SMTP_USER | No | user | SMTP username |
| SMTP_PASS | No | pass | SMTP password |
| SMTP_FROM | Yes | no-reply@elevate.ug | Email sender |
| APP_BASE_URL | Yes | http://localhost:5000 | Base URL used in links |
| ADMIN_EMAIL | Yes | admin@elevate.ug | Seed admin email |
| ADMIN_PHONE | Yes | +256701000001 | Seed admin phone |
| ADMIN_PASSWORD | Yes | Admin@1234 | Seed admin password |
| ADMIN_NAME | No | Elevate Admin | Seed admin display name |

## API Base URL

`/api/v1`

## API Response Format

Success response:

```json
{
  "success": true,
  "message": "Job listings retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

## API Reference

### Auth (`/api/v1/auth`)

- POST `/register` (Public)
  - Body: `{ email, phone, password, role, date_of_birth?, company_name?, industry? }`
  - Returns access/refresh token and user data.
- POST `/login` (Public)
  - Body: `{ email, password }`
- POST `/refresh-token` (Public)
  - Reads refresh token from cookie or body.
- POST `/logout` (Auth)
- POST `/forgot-password` (Public)
  - Body: `{ email }`
- POST `/reset-password` (Public)
  - Body: `{ email, token, newPassword }`
- POST `/verify-email` (Public)
  - Body: `{ token }`

### Users (`/api/v1/users`)

- GET `/me` (Auth any)
- PUT `/me/youth-profile` (Youth)
- POST `/me/upload-cv` (Youth, form-data `cv`)
- POST `/me/upload-portfolio` (Youth, form-data `portfolio`)
- PUT `/me/employer-profile` (Employer)
- POST `/me/upload-logo` (Employer, form-data `logo`)
- GET `/youth/:id` (Employer, Admin)
- GET `/` (Admin, paginated, filters: role, is_active, division)
- PATCH `/:id/status` (Admin)
  - Body: `{ is_active: true|false }`
- PATCH `/employers/:id/verify` (Admin)
  - Body: `{ registration_status: verified|rejected }`

### Jobs (`/api/v1/jobs`)

- POST `/` (Employer)
- PUT `/:id` (Employer owner)
- PATCH `/:id/publish` (Employer owner, verified)
- PATCH `/:id/close` (Employer owner)
- DELETE `/:id` (Employer owner, Admin)
- GET `/` (Public)
  - Filters: `division`, `job_type`, `skills`, `education_level`, `keyword`, `status`
- GET `/:id` (Public; id or slug)
- GET `/my/listings` (Employer)
- GET `/admin/all` (Admin)

### Applications (`/api/v1/applications`)

- POST `/jobs/:jobId/apply` (Youth)
- GET `/my` (Youth)
- GET `/jobs/:jobId/applicants` (Employer owner)
- PATCH `/:id/status` (Employer)
  - Body: `{ status: under_review|shortlisted|accepted|rejected }`
- PATCH `/:id/withdraw` (Youth)
- GET `/admin/all` (Admin)

### Resources (`/api/v1/resources`)

- POST `/` (Admin)
- PUT `/:id` (Admin)
- DELETE `/:id` (Admin)
- PATCH `/:id/publish` (Admin)
- GET `/` (Public)
- GET `/:id` (Public)
- POST `/:id/bookmark` (Youth)
- DELETE `/:id/bookmark` (Youth)
- GET `/my/bookmarks` (Youth)

## Role Permissions Matrix

| Capability | Public | Youth | Employer | Admin |
|---|---|---|---|---|
| Register/Login | Yes | Yes | Yes | Yes |
| Update youth profile | No | Yes | No | No |
| Update employer profile | No | No | Yes | No |
| Create/publish jobs | No | No | Yes | No |
| Apply jobs | No | Yes | No | No |
| Manage all users/jobs/apps/resources | No | No | No | Yes |
| Bookmark resources | No | Yes | No | No |

## File Upload Guide

- Youth CV:
  - Endpoint: POST `/api/v1/users/me/upload-cv`
  - Accepted MIME: `application/pdf`, DOCX MIME
  - Max size: 5 MB
- Youth portfolio and employer logo:
  - Endpoints: `/me/upload-portfolio`, `/me/upload-logo`
  - Accepted MIME: `image/png`, `image/jpeg`, `image/webp`
  - Max size: 3 MB
- Security:
  - MIME type is validated from file buffer with `file-type`
  - Filename is randomized as UUID + extension

## Error Codes Reference

- 400 Bad Request: malformed request payload
- 401 Unauthorized: missing/invalid token or credentials
- 403 Forbidden: role or business rule restriction
- 404 Not Found: resource does not exist
- 409 Conflict: duplicate or conflicting operation
- 422 Unprocessable Entity: validation failed
- 429 Too Many Requests: rate limit exceeded
- 500 Internal Server Error: unhandled server failure

## ERD Description (Text)

- `users` is the root identity table.
- `youth_profiles` has one-to-one with `users` for youth role.
- `employer_profiles` has one-to-one with `users` for employer role.
- `jobs` belongs to `employer_profiles`.
- `applications` joins `jobs` and `youth_profiles` (unique pair per job/youth).
- `resources` belongs to `users` (admin authoring).
- `bookmarks` joins `youth_profiles` and `resources` (unique pair).
- `refresh_tokens` and `password_reset_tokens` belong to `users`.

## Security Controls Implemented

- Helmet headers
- CORS allowlist policy
- Rate limiting (general and auth scopes)
- JWT access + refresh token model with rotation and DB hash storage
- Password hashing with bcrypt (rounds configurable, default 12)
- Validation via express-validator
- Parameterized SQL queries (`$1`, `$2`, ...)
- Upload MIME + size validation

## Deployment Guide (Ubuntu VPS)

1. Install runtime dependencies:

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx
```

2. Create production database and role:

```sql
CREATE ROLE elevate_user WITH LOGIN PASSWORD 'strong-password';
CREATE DATABASE elevate_db OWNER elevate_user;
```

3. Configure `.env` for production and run migration/seed.

4. Install PM2 and run process:

```bash
sudo npm install -g pm2
pm2 start server.js --name elevate-backend
pm2 save
pm2 startup
```

5. Configure Nginx reverse proxy (`/etc/nginx/sites-available/elevate`):

```nginx
server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/elevate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. Issue SSL certificate:

```bash
sudo certbot --nginx -d api.example.com
```

7. PostgreSQL hardening tips:

- Use dedicated DB role with least privileges.
- Restrict `pg_hba.conf` trusted hosts.
- Enforce strong passwords and rotate credentials.
- Enable regular backups and WAL archiving.
- Monitor slow queries and lock events.

## Scripts

- `npm run dev` - start dev server
- `npm start` - start production server
- `npm run db:migrate` - run schema migration
- `npm run db:seed` - seed sample data
- `npm run lint` - lint project
