# Bug report (what was broken → what was fixed)

## Critical

- **Cookie-session auth was not functioning reliably**
  - **Cause**: frontend was using a fake bearer token + backend CORS did not include Vite dev origin (`5173`)
  - **Fix**:
    - backend: added `http://localhost:5173` / `127.0.0.1:5173` CORS origins
    - frontend: removed bearer-token interceptor, implemented session hydration via `GET /api/auth/me`

- **Student redirect broken**
  - **Cause**: `/opportunities` route didn’t exist
  - **Fix**: redirect students to `/dashboard`

- **Role mismatch**
  - **Cause**: frontend used `recruiter` while backend uses `company`
  - **Fix**: standardized frontend roles to `student | company | admin`

- **Top bar referenced non-existent store method**
  - **Cause**: `TopBar` imported `setRole` but store didn’t implement it
  - **Fix**: removed `setRole` usage; added real logout calling backend

## Major

- **Company and student dashboards were using hardcoded demo data**
  - **Fix**: replaced with real API calls for stats, jobs, applicants, student profile, resume update.

- **Admin portal missing from frontend**
  - **Fix**: added admin routes + UI pages wired to existing `/api/admin/*` endpoints.

## Minor

- **User display fields inconsistent**
  - **Fix**: UI now displays `user.username` from session-backed `/auth/me`.

