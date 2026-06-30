from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.projects import _get_owned_project
from app.db.models import Design, User
from app.db.session import get_db
from app.services.report_builder import build_report_json, build_report_markdown

router = APIRouter(prefix="/projects/{project_id}/report", tags=["report"])


def _design(project_id: int, db: Session) -> Design | None:
    return db.query(Design).filter(Design.project_id == project_id).one_or_none()


@router.get("")
def report_json(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Full design report as a JSON bundle (all sections)."""
    project = _get_owned_project(project_id, user, db)
    return build_report_json(project, _design(project_id, db))


@router.get(".md", response_class=PlainTextResponse)
def report_markdown(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlainTextResponse:
    """Full design report as a downloadable Markdown document."""
    project = _get_owned_project(project_id, user, db)
    md = build_report_markdown(project, _design(project_id, db))
    return PlainTextResponse(
        md,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="report-{project_id}.md"'
        },
    )
