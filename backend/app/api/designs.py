from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.projects import _get_owned_project
from app.db.models import Design, User
from app.db.session import get_db
from app.schemas.design import DesignOut, DesignUpdate

router = APIRouter(prefix="/projects/{project_id}/design", tags=["designs"])


@router.get("", response_model=DesignOut)
def load_design(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Design:
    """Load the stored design for a project (404 if none generated yet)."""
    _get_owned_project(project_id, user, db)
    design = (
        db.query(Design).filter(Design.project_id == project_id).one_or_none()
    )
    if design is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No design yet"
        )
    return design


@router.put("", response_model=DesignOut)
def save_design(
    project_id: int,
    payload: DesignUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Design:
    """Save or update the design for a project.

    Upsert semantics: creates the design on first save, then applies partial
    updates (only fields present in the request body are written). This serves
    both the "save generated content" and "update generated content"
    deliverables.
    """
    _get_owned_project(project_id, user, db)

    design = (
        db.query(Design).filter(Design.project_id == project_id).one_or_none()
    )
    if design is None:
        design = Design(project_id=project_id)
        db.add(design)

    # exclude_unset: only overwrite fields the caller actually sent.
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(design, field, value)

    db.commit()
    db.refresh(design)
    return design
