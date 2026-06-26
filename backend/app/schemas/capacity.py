from pydantic import BaseModel, Field


class CapacityRequest(BaseModel):
    """Inputs for capacity estimation (Milestone 6).

    The three primary inputs are required by the spec; the rest are tunable
    sizing assumptions with sensible defaults.
    """

    dau: int = Field(gt=0, le=10_000_000_000, description="Daily active users")
    peak_traffic_factor: float = Field(default=3.0, gt=0, le=1000)
    actions_per_user: int = Field(default=30, gt=0, le=100_000)
    avg_request_size_kb: float = Field(default=2.0, gt=0, le=1_000_000)
    bytes_per_action: int = Field(default=1_000, gt=0, le=1_000_000_000)
    retention_days: int = Field(default=365, gt=0, le=36_500)


class CapacityResult(BaseModel):
    """Computed sizing estimates — the shape stored in ``designs.capacity_json``."""

    inputs: dict
    total_daily_requests: int
    average_rps: float
    peak_rps: float
    storage_growth_per_day_bytes: int
    storage_growth_per_month_bytes: int
    storage_growth_per_month_human: str
    peak_bandwidth_bytes_per_sec: float
    peak_bandwidth_human: str
    database_size_bytes: int
    database_size_human: str
    cache_recommendation: str
