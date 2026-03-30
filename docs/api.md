# Placement Management System — API

Base URL (dev): `http://localhost:5000/api`

Auth is **cookie-session** (Flask session). The frontend uses `withCredentials: true`.

## Conventions

- **Errors**: `{ "error": "message" }` with appropriate HTTP status code
- **Auth**:
  - Not logged in: **401**
  - Wrong role: **403**

## Auth (`/auth`)

### POST `/auth/register`

Registers a **student** or **company** user.

- **Student body**:
  - `role`: `"student"`
  - `username`, `password`
  - `full_name`, `email`, `department`, `graduation_year`, `cgpa`
  - optional: `phone`
- **Company body**:
  - `role`: `"company"`
  - `username`, `password`
  - `company_name`, `hr_email`
  - optional: `industry`, `website`, `hr_name`, `hr_phone`

**Response**: `201 { "message": "Registration successful. Please log in." }`

### POST `/auth/login`

**Body**: `{ "username": "...", "password": "..." }`

**Response**: `200 { "message": "Login successful", "user": { "user_id", "username", "role", "entity_id" } }`

### POST `/auth/logout`

Clears session.

**Response**: `200 { "message": "Logged out" }`

### GET `/auth/me`

Returns current user based on session cookie.

**Response**: `200 { "user_id", "username", "role", "entity_id" }`

## Student (`/student`) — role: `student`

### GET `/student/dashboard`

Returns application pipeline counters.

**Response**:
- `200 { total_applied, shortlisted, interviews_scheduled, selected, rejected, offers_accepted }`

### GET `/student/profile`

Returns the `Students` row for the logged-in student.

### PUT `/student/profile`

Updates allowed fields: `phone`, `resume_url`, `cgpa`, `backlogs`.

### GET `/student/jobs/search`

Approved jobs search & filter.

**Query params**:
- `search`: string
- `roles`: comma-separated (`Full-Time,Internship,Contract`)
- `minCgpa`: number
- `sort`: `recent | deadline | salary`

### POST `/student/jobs/apply`

**Body**: `{ "job_id": number }`

### GET `/student/applications`

Lists student applications with job + company.

### GET `/student/applications/:application_id/interviews`

Lists interview rounds + results for one application.

### GET `/student/offers`

Lists offers (`Placements`) for the student.

### PUT `/student/offers/:placement_id/respond`

**Body**: `{ "decision": "Accepted" | "Declined" }`

Also keeps `Applications.status` consistent (`Offer_Accepted` / `Offer_Declined`).

## Company (`/company`) — role: `company`

### GET `/company/dashboard`

Returns company dashboard counters.

### GET `/company/jobs`

Lists jobs for the company with `total_applications`.

### POST `/company/jobs`

Creates a job posting (requires company approved). Jobs start as `is_approved = false` until admin approval.

### PUT `/company/jobs/:job_id`

Updates a job posting (ownership required).

### GET `/company/jobs/:job_id/applicants`

Lists applicants (application + student details).

### PUT `/company/applications/:application_id/status`

**Body**: `{ "status": "Shortlisted" | "Rejected" | "Selected" }`

### POST `/company/interviews`

Schedules an interview round.

### GET `/company/interviews`

Lists all interview rounds across the company's jobs.

### POST `/company/interviews/result`

Records an interview result (uses stored procedure `sp_record_interview_result`).

### POST `/company/offers`

Extends an offer (uses stored procedure `sp_extend_offer`).

### GET `/company/offers`

Lists all offers created via the company's jobs.

## Admin (`/admin`) — role: `admin`

### GET `/admin/dashboard`

Platform-wide stats + pending approvals.

### GET `/admin/companies`

**Query**: `approved=true|false`

### PUT `/admin/companies/:company_id/approve`

**Body**: `{ "approve": true|false }`

### GET `/admin/jobs`

**Query**: `approved=true|false`

### PUT `/admin/jobs/:job_id/approve`

**Body**: `{ "approve": true|false }`

### GET `/admin/students`

**Query**: `department`, `is_placed=true|false`, `cgpa_min`

### GET `/admin/students/:student_id`

Full student profile bundle.

### Reports

- GET `/admin/reports/departments`
- GET `/admin/reports/top-companies`
- GET `/admin/reports/skills`
- GET `/admin/reports/ctc-bands`
- GET `/admin/reports/monthly-trend`
- GET `/admin/reports/at-risk-students`
