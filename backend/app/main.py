from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.designs import router as designs_router
from app.api.generate import router as generate_router
from app.api.health import router as health_router
from app.api.projects import router as projects_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(designs_router)
app.include_router(generate_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "status": "running"}
