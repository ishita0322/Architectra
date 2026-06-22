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

## Backend health endpoints

- `GET /health` — process liveness
- `GET /health/db` — database connectivity

## Database migrations (Alembic)

```bash
docker compose exec backend alembic revision --autogenerate -m "message"
docker compose exec backend alembic upgrade head
```

## Project status

- [x] **Milestone 0** — project setup (frontend, backend, DB, Docker)
- [ ] Milestone 1 — authentication
- [ ] Milestone 2 — project management
- [ ] ... see `steps.md`
