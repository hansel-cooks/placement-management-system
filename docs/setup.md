# Setup (Windows / local dev)

## Prerequisites

- **MySQL 8+**
- **Python 3.12**
- **Node.js** (installed via winget in this workspace)

## 1) Database

1. Create the database:

```sql
CREATE DATABASE placement_db;
```

2. Run the schema + seed:
   - `database/schema.sql`
   - `database/queries.sql`

## 2) Backend (Flask)

1. Create `backend/.env`:

Copy from `backend/.env.example` and update credentials.

Recommended dev values:
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `CSRF_ENABLED=true`

2. Install deps:

```bash
cd backend
python -m pip install -r requirements.txt
```

3. Run:

```bash
python app.py
```

Backend runs at `http://localhost:5000/api/health`.

## 3) Frontend (Vite + React)

1. Install deps:

```bash
cd frontend
npm install
```

2. Run:

```bash
npm run dev
```

Frontend runs at Vite dev URL (typically `http://localhost:5173`).

## Default admin login

- **username**: `admin`
- **password**: `admin123`

Change this immediately in production.

## Production notes (deploy readiness)

- Set `SESSION_COOKIE_SECURE=true` and serve over HTTPS.
- Use `SESSION_TYPE=redis` + `REDIS_URL=redis://...` for multi-instance deployments.
- Set `CORS_ORIGINS` to your real portal domain(s).

