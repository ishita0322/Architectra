from pydantic import BaseModel


class DiagramResult(BaseModel):
    """Mermaid diagram source — stored in ``designs.diagram_text``."""

    diagram_text: str
