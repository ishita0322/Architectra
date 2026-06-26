"""Deterministic capacity / sizing engine (Milestone 6).

No AI. Given a handful of traffic inputs, computes back-of-the-envelope sizing
estimates the way a system designer would on a whiteboard. Pure functions —
same inputs always produce the same outputs — so results are reproducible and
unit-testable.

Inputs (per the milestone spec):
  - dau                  : daily active users
  - peak_traffic_factor  : peak load multiplier over the average (e.g. 3x)
  - actions_per_user     : requests a user makes per day

Tunable assumptions (sane defaults; overridable by the caller):
  - avg_request_size_kb  : bytes in/out per request, for bandwidth
  - bytes_per_action     : durable bytes written per action, for storage
  - retention_days       : how long stored data is kept, for DB size

Outputs (per the milestone spec):
  - peak_rps, average_rps, storage_growth, bandwidth, database_size,
    cache_recommendation
"""

from dataclasses import dataclass

SECONDS_PER_DAY = 86_400
DAYS_PER_MONTH = 30


@dataclass(frozen=True)
class CapacityInputs:
    dau: int
    peak_traffic_factor: float = 3.0
    actions_per_user: int = 30
    avg_request_size_kb: float = 2.0
    bytes_per_action: int = 1_000
    retention_days: int = 365


def _human_bytes(num_bytes: float) -> str:
    """Format a byte count with binary units (KB/MB/GB/TB/PB)."""
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    value = float(num_bytes)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.2f} {unit}"
        value /= 1024
    return f"{value:.2f} PB"  # pragma: no cover (loop always returns)


def _cache_recommendation(peak_rps: float) -> str:
    """Pick a cache posture from peak RPS — deterministic thresholds."""
    if peak_rps < 100:
        return "No cache required — traffic is low enough for the database to serve directly."
    if peak_rps < 1_000:
        return "Single Redis instance recommended for hot reads."
    if peak_rps < 10_000:
        return "Redis with replicas recommended; cache hot keys and sessions."
    return "Distributed cache cluster (Redis Cluster) required; shard hot keys across nodes."


def compute_capacity(inputs: CapacityInputs) -> dict:
    """Compute sizing estimates from traffic inputs. Pure function."""
    total_daily_requests = inputs.dau * inputs.actions_per_user

    average_rps = total_daily_requests / SECONDS_PER_DAY
    peak_rps = average_rps * inputs.peak_traffic_factor

    # Bandwidth at peak: requests/sec * size each (counted once in, once out).
    peak_bandwidth_bytes_per_sec = peak_rps * inputs.avg_request_size_kb * 1024 * 2

    # Durable storage written per day, and growth per month.
    storage_per_day_bytes = total_daily_requests * inputs.bytes_per_action
    storage_per_month_bytes = storage_per_day_bytes * DAYS_PER_MONTH

    # Total database size over the retention window.
    database_size_bytes = storage_per_day_bytes * inputs.retention_days

    return {
        "inputs": {
            "dau": inputs.dau,
            "peak_traffic_factor": inputs.peak_traffic_factor,
            "actions_per_user": inputs.actions_per_user,
            "avg_request_size_kb": inputs.avg_request_size_kb,
            "bytes_per_action": inputs.bytes_per_action,
            "retention_days": inputs.retention_days,
        },
        "total_daily_requests": total_daily_requests,
        "average_rps": round(average_rps, 2),
        "peak_rps": round(peak_rps, 2),
        "storage_growth_per_day_bytes": storage_per_day_bytes,
        "storage_growth_per_month_bytes": storage_per_month_bytes,
        "storage_growth_per_month_human": _human_bytes(storage_per_month_bytes),
        "peak_bandwidth_bytes_per_sec": peak_bandwidth_bytes_per_sec,
        "peak_bandwidth_human": _human_bytes(peak_bandwidth_bytes_per_sec) + "/s",
        "database_size_bytes": database_size_bytes,
        "database_size_human": _human_bytes(database_size_bytes),
        "cache_recommendation": _cache_recommendation(peak_rps),
    }
