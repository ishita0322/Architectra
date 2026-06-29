"""Diagram generation (Milestone 8).

Deterministically converts a stored architecture into a Mermaid ``graph TD``.
No AI: the architecture already carries ``depends_on`` relationships, so the
diagram is built directly from them — guaranteeing valid, reproducible Mermaid
every time (an LLM emitting Mermaid by hand often produces syntax errors).
"""

import re

from app.schemas.architecture import Architecture

# Heuristics for connecting a top-level "User" node to the entry point(s).
_ENTRY_HINTS = ("gateway", "api", "frontend", "web", "edge", "load balancer", "lb")


def _node_id(name: str) -> str:
    """Stable, Mermaid-safe identifier for a component name."""
    slug = re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_")
    if not slug:
        slug = "node"
    if slug[0].isdigit():
        slug = "n_" + slug
    return slug


def _label(name: str) -> str:
    """Escape a label for use inside Mermaid ``["..."]``."""
    return name.replace('"', "'")


def build_mermaid(architecture: Architecture) -> str:
    """Return a Mermaid ``graph TD`` describing the architecture."""
    lines = ["graph TD"]

    # Collect every known component name so we can resolve depends_on targets
    # and assign each a node id + declaration.
    services = architecture.services
    components = (
        architecture.databases + architecture.queues + architecture.caches
    )

    known: dict[str, str] = {}  # name -> node id
    for c in [*services, *components]:
        known.setdefault(c.name, _node_id(c.name))

    # Declare service nodes (rectangles) and backing components (rounded).
    for s in services:
        lines.append(f'    {known[s.name]}["{_label(s.name)}"]')
    for c in components:
        lines.append(f'    {known[c.name]}("{_label(c.name)}")')

    # A User node entering at the gateway/entry services.
    entry_services = [
        s for s in services if any(h in s.name.lower() for h in _ENTRY_HINTS)
    ]
    if not entry_services and services:
        entry_services = [services[0]]  # fall back to the first service
    if entry_services:
        lines.append('    User(("User"))')
        for s in entry_services:
            lines.append(f"    User --> {known[s.name]}")

    # Edges from each service's declared dependencies.
    for s in services:
        for dep in s.depends_on:
            target = known.get(dep)
            if target is None:
                # Dependency on something not declared elsewhere — add it.
                target = _node_id(dep)
                known[dep] = target
                lines.append(f'    {target}["{_label(dep)}"]')
            lines.append(f"    {known[s.name]} --> {target}")

    return "\n".join(lines)
