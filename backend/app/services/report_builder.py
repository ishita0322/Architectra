"""Design report assembly (Milestone 11).

Deterministically assembles all stored design sections into a single Markdown
document and a JSON bundle. Missing sections are noted rather than omitted, so
a partial design still produces a coherent report.
"""

from typing import Any

from app.db.models import Design, Project


def _list_block(items: Any) -> str:
    if not isinstance(items, list) or not items:
        return "_None._\n"
    return "".join(f"- {item}\n" for item in items)


def _requirements_md(data: dict[str, Any] | None) -> str:
    if not data:
        return "_Not generated._\n"
    out = ["**Functional**\n", _list_block(data.get("functional")), "\n"]
    out += ["**Non-functional**\n", _list_block(data.get("non_functional")), "\n"]
    out += ["**Assumptions**\n", _list_block(data.get("assumptions"))]
    return "".join(out)


def _capacity_md(data: dict[str, Any] | None) -> str:
    if not data:
        return "_Not generated._\n"
    rows = [
        ("Peak RPS", data.get("peak_rps")),
        ("Average RPS", data.get("average_rps")),
        ("Bandwidth (peak)", data.get("peak_bandwidth_human")),
        ("Storage growth / month", data.get("storage_growth_per_month_human")),
        ("Database size", data.get("database_size_human")),
        ("Daily requests", data.get("total_daily_requests")),
    ]
    md = "| Metric | Value |\n| --- | --- |\n"
    md += "".join(f"| {k} | {v} |\n" for k, v in rows if v is not None)
    if data.get("cache_recommendation"):
        md += f"\n**Cache recommendation:** {data['cache_recommendation']}\n"
    return md


def _components_block(title: str, items: Any) -> str:
    if not isinstance(items, list) or not items:
        return ""
    out = [f"**{title}**\n"]
    for c in items:
        if isinstance(c, dict):
            name = c.get("name", "")
            extra = c.get("purpose") or c.get("responsibility") or ""
            deps = c.get("depends_on")
            line = f"- {name}"
            if extra:
                line += f" — {extra}"
            if isinstance(deps, list) and deps:
                line += f" (depends on: {', '.join(deps)})"
            out.append(line + "\n")
    out.append("\n")
    return "".join(out)


def _architecture_md(data: dict[str, Any] | None) -> str:
    if not data:
        return "_Not generated._\n"
    md = _components_block("Services", data.get("services"))
    md += _components_block("Databases", data.get("databases"))
    md += _components_block("Queues", data.get("queues"))
    md += _components_block("Caches", data.get("caches"))
    return md or "_Empty._\n"


def _diagram_md(text: str | None) -> str:
    if not text:
        return "_Not generated._\n"
    return f"```mermaid\n{text}\n```\n"


def _database_md(data: dict[str, Any] | None) -> str:
    if not data:
        return "_Not generated._\n"
    out = []
    for t in data.get("tables", []):
        if not isinstance(t, dict):
            continue
        out.append(f"#### `{t.get('name', '')}`\n\n")
        cols = t.get("columns") or []
        if cols:
            out.append("| Column | Type | Constraints |\n| --- | --- | --- |\n")
            for c in cols:
                if isinstance(c, dict):
                    out.append(
                        f"| {c.get('name','')} | {c.get('type','')} | {c.get('constraints','')} |\n"
                    )
            out.append("\n")
        if t.get("indexes"):
            out.append(f"_Indexes: {', '.join(t['indexes'])}_\n\n")
    if data.get("sql"):
        out.append("**SQL**\n\n```sql\n" + data["sql"] + "\n```\n")
    return "".join(out) or "_Empty._\n"


def _apis_md(data: dict[str, Any] | None) -> str:
    if not data:
        return "_Not generated._\n"
    out = []
    for ep in data.get("endpoints", []):
        if not isinstance(ep, dict):
            continue
        out.append(f"#### `{ep.get('method','')} {ep.get('path','')}`\n\n")
        if ep.get("summary"):
            out.append(f"{ep['summary']}\n\n")
        if ep.get("request_model"):
            out.append(f"Request: `{ep['request_model']}`\n\n")
        if ep.get("response_model"):
            out.append(f"Response: `{ep['response_model']}`\n\n")
        for er in ep.get("error_responses", []) or []:
            if isinstance(er, dict):
                out.append(f"- `{er.get('status','')}` {er.get('description','')}\n")
        out.append("\n")
    return "".join(out) or "_Empty._\n"


def build_report_markdown(project: Project, design: Design | None) -> str:
    """Assemble the full design report as a Markdown document."""
    d = design
    sections = [
        f"# {project.title}\n",
        f"> {project.prompt}\n" if project.prompt else "",
        "\n## Requirements\n\n" + _requirements_md(d.requirements_json if d else None),
        "\n## Capacity\n\n" + _capacity_md(d.capacity_json if d else None),
        "\n## Architecture\n\n" + _architecture_md(d.architecture_json if d else None),
        "\n## Diagram\n\n" + _diagram_md(d.diagram_text if d else None),
        "\n## Database Design\n\n" + _database_md(d.database_json if d else None),
        "\n## API Contracts\n\n" + _apis_md(d.api_json if d else None),
    ]
    return "".join(sections)


def build_report_json(project: Project, design: Design | None) -> dict[str, Any]:
    """Assemble the full design report as a JSON bundle."""
    return {
        "project": {
            "id": project.id,
            "title": project.title,
            "prompt": project.prompt,
        },
        "requirements": design.requirements_json if design else None,
        "capacity": design.capacity_json if design else None,
        "architecture": design.architecture_json if design else None,
        "diagram": design.diagram_text if design else None,
        "database": design.database_json if design else None,
        "apis": design.api_json if design else None,
    }
