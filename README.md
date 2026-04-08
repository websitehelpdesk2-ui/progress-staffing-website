# Progress Staffing Agency

A simple marketing website for a staffing agency focused on warehouse/logistics roles and healthcare positions (CNA, LPN, RN, CMA, Dietary Aides).

This project now includes role-based portal scaffolding for:

- Employee portal
- Jobsite portal
- Admin portal

## Development

### Run locally (with backend)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser.

### Frontend-only (no backend)

- Open `index.html` in a browser to view the static site.

## How it works

- The site is served statically from `index.html`.
- Job applications are submitted via `apply.html` and posted to `/api/apply`.
- In production, structured application and portal data must be stored in PostgreSQL via `DATABASE_URL`.
- Local SQLite (`data/app.db`) is only a development fallback and migration source.
- After applying, candidates are redirected into portal onboarding (register/login).
- Portal auth uses email/password login, optional 4-digit passcodes, and session tokens.
- View submissions at `GET /api/applications` (admin role required).
- Matching open shifts now notify employees through the portal plus optional email, SMS, and browser push notifications.

## Portal URLs

- Login: `http://localhost:3000/portal-login`
- Register: `http://localhost:3000/portal-register`
- Employee: `http://localhost:3000/portal-employee`
- Jobsite: `http://localhost:3000/portal-jobsite`
- Admin: `http://localhost:3000/portal-admin`

## Auth API

- `POST /api/auth/register` (self-register as `employee` or `jobsite`)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Portal API (Protected)

- `GET /api/portal/employee/dashboard` (employee)
- `POST /api/portal/employee/documents` (employee document upload)
- `GET /api/shifts/open` (matching open shifts)
- `POST /api/shifts/:id/accept` (employee, requires password or passcode)
- `POST /api/shifts/:id/decline` (employee, requires password or passcode)
- `POST /api/shifts/assignments/:id/withdraw` (employee, requires password or passcode)
- `GET /api/shifts/offers` (employee)
- `POST /api/shifts/assignments/:id/offer` (employee, requires password or passcode)
- `POST /api/shifts/offers/:id/respond` (employee, requires password or passcode)
- `GET /api/messages` (all portal roles)
- `POST /api/messages` (all portal roles)
- `PATCH /api/account` (employee and jobsite account updates)
- `GET /api/notifications/vapid-public-key`
- `POST /api/notifications/subscribe`
- `GET /api/portal/jobsite/dashboard` (jobsite)
- `POST /api/portal/jobsite/jobs` (jobsite)
- `PUT /api/portal/jobsite/jobs/:id` (jobsite)
- `PATCH /api/portal/jobsite/jobs/:id/status` (jobsite)
- `GET /api/portal/admin/dashboard` (admin)
- `GET /api/admin/users` (admin)
- `GET /api/admin/employees` (admin)
- `GET /api/admin/jobs` (admin)
- `GET /api/admin/assignments` (admin)
- `POST /api/admin/assignments` (admin)
- `PATCH /api/admin/assignments/:id` (admin)
- `PATCH /api/admin/account` (admin)
- `GET /api/applications` (admin)

## Employee Onboarding Flow

- Candidate submits `apply.html` form.
- API saves application and returns next-step URL.
- Candidate is redirected to:
   - `/portal-register?...` for new employee account setup
   - `/portal-login?...` when employee account already exists
- Employee portal shows submitted applications and uploaded documents.

## Employee Document Rules

- Warehouse workers:
   - Resume: optional
   - ID / Driver's License: required
   - Social Security card / Work authorization permit: required

- Healthcare workers (CNA, CMA, RN, LPN/LVN, Dietary Aide):
   - Resume: required
   - ID / Driver's License: required
   - Social Security card / Work authorization permit: required
   - Hepatitis B: required
   - MMR / Varicella: required
   - Licenses / Certifications: required (expiration date required)
   - CPR/BLS Certificate: required (expiration date required)
   - Dependent Adult Abuse Mandatory Reporter Training: required (expiration date required)
   - Covid-19 Vaccine Card: optional

- Employee profile includes optional W-4 form completion in portal.

## Role-Specific Profile Completion

- Employee dashboard now receives backend-calculated compliance status by track.
- Completion is role-specific by latest application industry:
   - Warehouse profile rules for warehouse workers.
   - Healthcare profile rules for CNA, CMA, RN, LPN/LVN, and Dietary Aide.
- Profile completion passes only when required documents are present and required expiration dates are provided.

## Notifications

- When a jobsite posts a new open shift, employees whose latest registered position matches the shift title will see it in their portal automatically.
- Those matching employees can also receive optional notifications by:
   - Email
   - SMS text message
   - Browser push notifications from the installed portal app/PWA
- Push notification action buttons deep-link employees into the portal so they can confirm accept/decline actions with their password or 4-digit passcode.

## Notification Environment Variables

- `APP_BASE_URL`: public base URL used in email and SMS links.
- `DATABASE_URL`: PostgreSQL connection string used for all structured production data.
- `STORAGE_BACKEND`: set to `s3` for object storage or `local` for an explicit durable filesystem mount.
- `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`: required for S3-compatible object storage.
- `STORAGE_S3_ENDPOINT`: optional custom endpoint for S3-compatible providers.
- `STORAGE_S3_FORCE_PATH_STYLE`: optional `true`/`false` for S3-compatible providers that require path-style requests.
- `UPLOAD_STORAGE_DIR`: required only when `STORAGE_BACKEND=local`; this must not point at Render ephemeral app disk.
- `POSTMARK_SERVER_TOKEN`: Postmark server API token for outbound mail.
- `EMAIL_FROM`: sender address for email notifications. Defaults to `onboarding@progressstaffingagency.com`.
- `EMAIL_REPLY_TO`: reply-to address for email notifications. Defaults to `onboarding@progressstaffingagency.com`.
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: required in production. Production no longer falls back to `data/vapid-keys.json`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: optional non-production bootstrap credentials if you explicitly want startup seeding.
- `SCOPED_PORTAL_PASSCODE`, `ONBOARDING_PORTAL_EMAIL`, `CONTRACTS_PORTAL_EMAIL`, `SCHEDULING_PORTAL_EMAIL`: optional non-production scoped-portal seed settings.

If Postmark, Twilio, or push settings are not configured, the related notification channel is skipped without breaking shift posting.

## Test Email Route

- `POST /api/admin/test-email` (admin)
- Request body accepts `to`, `subject`, `text`, and optional `html`.
- Uses the live Postmark service configuration and returns the provider response payload.

## Deployment

- For a static-only deployment, deploy the folder to any static host (GitHub Pages, Netlify, Vercel).
- For backend functionality, deploy the Node.js server with PostgreSQL configured through `DATABASE_URL`.
- Before first production boot on Render, import existing SQLite data with `npm run migrate:sqlite-to-postgres`.
- Configure S3-compatible object storage before relying on uploaded files in production. Use `STORAGE_BACKEND=local` with `UPLOAD_STORAGE_DIR` only when you have an explicit durable mounted filesystem.
