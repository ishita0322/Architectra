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
- `PATCH /projects/{id}` — update `title` and/or `prompt` (partial; 404 if not owned)
- `DELETE /projects/{id}` — delete (204; 404 if missing or not owned)

Design storage (Milestone 4, auth + project ownership required):
- `GET /projects/{id}/design` — load stored design (404 until first save)
- `PUT /projects/{id}/design` — save/update; upsert with partial-field semantics
  (sends any subset of `requirements_json`, `capacity_json`, `architecture_json`,
  `database_json`, `api_json`, `diagram_text`; unsent fields are left untouched)

Generation (Milestone 5+, auth + project ownership required):
- `POST /projects/{id}/generate/requirements` — `{ prompt? }` → `{ functional,
  non_functional, assumptions }`. Uses `prompt` if given (and saves it onto the
  project), else the project's stored prompt. Result is stored automatically in
  `designs.requirements_json`. Requires a running Ollama (see **AI setup**).
- `POST /projects/{id}/generate/capacity` — **deterministic, no AI**. Body:
  `{ dau, peak_traffic_factor?, actions_per_user?, ... }` → peak/avg RPS, storage
  growth, bandwidth, database size, cache recommendation. Computed by
  `app/services/capacity_engine.py`; stored in `designs.capacity_json`.
- `POST /projects/{id}/generate/architecture` — generates `{ services (with
  depends_on relationships), databases, queues, caches }` from the project's
  prompt + stored requirements + capacity. Stored in `designs.architecture_json`.
  Requires Ollama.
- `POST /projects/{id}/generate/diagram` — **deterministic, no AI**. Builds a
  Mermaid `graph TD` from the stored architecture's relationships. Stored in
  `designs.diagram_text`. 422 if architecture hasn't been generated. Rendered in
  the workspace with SVG/PNG export.
- `POST /projects/{id}/generate/database` — generates `{ tables (columns +
  indexes), relationships, sql }` from the project's prompt + stored
  requirements + architecture. Stored in `designs.database_json`. Rendered with
  an ER diagram (Mermaid) and SQL export. Requires Ollama.
- `POST /projects/{id}/generate/apis` — generates `{ endpoints (method, path,
  request/response models, error responses) }` from the project's prompt +
  stored requirements + architecture + database. The OpenAPI 3.0 document is
  synthesized deterministically from the endpoints (Swagger-ready, exportable).
  Stored in `designs.api_json`. Requires Ollama.

## AI setup (Ollama, required from Milestone 5)

Generation calls a local [Ollama](https://ollama.com) server over its REST API
(`FastAPI → httpx → Ollama → Qwen3`). Install and pull the model once:

```bash
curl -fsSL https://ollama.com/install.sh | sh   # starts ollama on :11434
ollama pull qwen3:8b
curl -s localhost:11434/api/tags                 # verify the model is listed
```

`OLLAMA_BASE_URL` defaults to `http://localhost:11434` for local venv dev; set
it to `http://host.docker.internal:11434` under docker compose so the container
can reach Ollama on the host. CPU inference is slow — measured ~5 tokens/sec
for qwen3:8b (Q4); the database-schema generator emits the most tokens and can
take ~400-430s. The backend allows up to `OLLAMA_TIMEOUT_SECONDS` (default 600).
On a GPU this is far faster. Reasoning-model "thinking" is disabled
(`think: false`) to roughly halve latency and keep generation within the
timeout.

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
- [x] **Milestone 5** — requirements generator (Ollama provider abstraction; `POST .../generate/requirements`, auto-stored, regeneratable)
- [x] **Milestone 6** — capacity engine (deterministic sizing; dashboard + charts; auto-stored in `capacity_json`)
- [x] **Milestone 7** — architecture generator (services/databases/queues/caches + relationships; auto-stored in `architecture_json`)
- [x] **Milestone 8** — diagram generator (deterministic Mermaid from architecture; rendered with SVG + PNG export)
- [x] **Milestone 9** — database schema generator (tables/relationships/indexes + SQL DDL; ER diagram + SQL export)
- [x] **Milestone 10** — API contract generator (endpoints + request/response/error models; synthesized OpenAPI 3.0; export)
- [ ] ... see `steps.md`
