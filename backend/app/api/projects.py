from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Project, User
from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(project_id: int, user: User, db: Session) -> Project:
    """Fetch a project owned by `user`, or 404.

    Using 404 (not 403) for projects owned by other users avoids revealing
    that an id exists.
    """
    project = db.get(Project, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    project = Project(user_id=user.id, title=payload.title, prompt=payload.prompt)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Project]:
    stmt = (
        select(Project)
        .where(Project.user_id == user.id)
        .order_by(Project.updated_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    return _get_owned_project(project_id, user, db)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Project:
    """Update a project's title and/or prompt (partial)."""
    project = _get_owned_project(project_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    project = _get_owned_project(project_id, user, db)
    db.delete(project)
    db.commit()
