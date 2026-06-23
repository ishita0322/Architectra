# AI System Architect

Converts a natural-language system design prompt into a structured software
architecture report (requirements, capacity, architecture, diagram, schema,
APIs, exportable report).

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS
- **Backend:** FastAPI, Python 3.12, SQLAlchemy, Alembic, Pydantic
- **Database:** PostgreSQL 16
- **AI:** Ollama (Qwen3 8B) — wired in from Milestone 5
- **Infra:** Docker + Docker Compose

## Quick start (local, no Docker)

The backend runs in a project-local Python venv against a file-based **SQLite**
database (zero setup, no system services). The frontend runs via Vite.

```bash
# Backend  (terminal 1)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time
.venv/bin/uvicorn app.main:app --reload

# Frontend (terminal 2)
cd frontend
npm install        # first time
npm run dev
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |

## Alternative: Docker Compose (PostgreSQL)

Docker config is included and uses PostgreSQL. Point `backend/.env`'s
`DATABASE_URL` at the `db` service (see `.env.example`) and run:

```bash
docker compose up --build
```

The backend auto-detects SQLite vs Postgres from `DATABASE_URL` — no code change
needed to switch.

The frontend home page shows a live status panel for the frontend, backend,
and database — all three dots green means the environment is wired correctly.

## Backend endpoints

Health:
- `GET /health` — process liveness
- `GET /health/db` — database connectivity

Auth (Milestone 1):
- `POST /auth/register` — `{ email, password }` → created user (409 if email taken)
- `POST /auth/login` — OAuth2 form (`username`=email, `password`) → `{ access_token }`
- `GET /auth/me` — current user (requires `Authorization: Bearer <token>`)

Projects (Milestone 2, all require auth; scoped to the current user):
- `POST /projects` — `{ title, prompt? }` → created project
- `GET /projects` — list the user's projects (newest first)
- `GET /projects/{id}` — one project (404 if missing or not owned)
- `DELETE /projects/{id}` — delete (204; 404 if missing or not owned)

Design storage (Milestone 4, auth + project ownership required):
- `GET /projects/{id}/design` — load stored design (404 until first save)
- `PUT /projects/{id}/design` — save/update; upsert with partial-field semantics
  (sends any subset of `requirements_json`, `capacity_json`, `architecture_json`,
  `database_json`, `api_json`, `diagram_text`; unsent fields are left untouched)

## Database migrations (Alembic)

```bash
docker compose exec backend alembic revision --autogenerate -m "message"
docker compose exec backend alembic upgrade head
```

## Project status

- [x] **Milestone 0** — project setup (frontend, backend, DB, Docker)
- [x] **Milestone 1** — authentication (register / login / me, JWT, protected routes)
- [x] **Milestone 2** — project management (projects CRUD, user-scoped; dashboard create/list/delete)
- [x] **Milestone 3** — design workspace (3-panel layout, section nav, responsive; opens per project)
- [x] **Milestone 4** — design storage (`designs` table; save / load / partial-update generated output)
- [ ] ... see `steps.md`
