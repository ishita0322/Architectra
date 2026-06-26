"""Generation endpoints (Milestone 5+).

Each endpoint generates one section of the design from the project's prompt and
stores it on the project's ``Design`` row automatically, so the workspace can
reload it later. Routes are project-scoped and owner-checked, mirroring the
designs router.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai import LLMError, LLMProvider, get_provider
from app.api.deps import get_current_user
from app.api.projects import _get_owned_project
from app.db.models import Design, Project, User
from app.db.session import get_db
from app.schemas.architecture import Architecture
from app.schemas.capacity import CapacityRequest, CapacityResult
from app.schemas.requirements import Requirements, RequirementsGenerateRequest
from app.services.architecture_generator import generate_architecture
from app.services.capacity_engine import CapacityInputs, compute_capacity
from app.services.requirements_generator import generate_requirements

router = APIRouter(prefix="/projects/{project_id}/generate", tags=["generate"])


def _get_or_create_design(project_id: int, db: Session) -> Design:
    design = (
        db.query(Design).filter(Design.project_id == project_id).one_or_none()
    )
    if design is None:
        design = Design(project_id=project_id)
        db.add(design)
    return design


@router.post("/requirements", response_model=Requirements)
async def generate_requirements_endpoint(
    project_id: int,
    payload: RequirementsGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    provider: LLMProvider = Depends(get_provider),
) -> Requirements:
    """Generate structured requirements for a project and store them.

    Uses ``payload.prompt`` if given (and saves it onto the project so the
    editor stays in sync), otherwise the project's stored prompt.
    """
    project: Project = _get_owned_project(project_id, user, db)

    prompt = (payload.prompt if payload.prompt is not None else project.prompt) or ""
    if not prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A prompt is required to generate requirements.",
        )

    try:
        requirements = await generate_requirements(provider, prompt)
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc

    # Persist the prompt (if newly supplied) and the generated requirements.
    if payload.prompt is not None:
        project.prompt = payload.prompt
    design = _get_or_create_design(project_id, db)
    design.requirements_json = requirements.model_dump()

    db.commit()
    return requirements


@router.post("/capacity", response_model=CapacityResult)
def generate_capacity_endpoint(
    project_id: int,
    payload: CapacityRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CapacityResult:
    """Compute deterministic capacity estimates and store them.

    No AI — pure calculation via ``capacity_engine``. Result is stored on the
    project's design (``capacity_json``) so the workspace can reload it.
    """
    _get_owned_project(project_id, user, db)

    result = compute_capacity(
        CapacityInputs(
            dau=payload.dau,
            peak_traffic_factor=payload.peak_traffic_factor,
            actions_per_user=payload.actions_per_user,
            avg_request_size_kb=payload.avg_request_size_kb,
            bytes_per_action=payload.bytes_per_action,
            retention_days=payload.retention_days,
        )
    )

    design = _get_or_create_design(project_id, db)
    design.capacity_json = result
    db.commit()

    return CapacityResult(**result)


@router.post("/architecture", response_model=Architecture)
async def generate_architecture_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    provider: LLMProvider = Depends(get_provider),
) -> Architecture:
    """Generate the component architecture and store it.

    Input is the project's prompt plus its already-generated requirements and
    capacity (per the milestone spec). Result is stored in
    ``designs.architecture_json``.
    """
    project: Project = _get_owned_project(project_id, user, db)
    design = _get_or_create_design(project_id, db)

    try:
        architecture = await generate_architecture(
            provider,
            project.prompt or "",
            design.requirements_json,
            design.capacity_json,
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc

    design.architecture_json = architecture.model_dump()
    db.commit()

    return architecture
