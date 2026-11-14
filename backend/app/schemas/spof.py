"""M3 SPOF schemas: ranked single points of failure plus the graph for the UI."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.enums import ProcessCode
from app.schemas.common import TraceEntry


class _Out(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SpofNode(_Out):
    id: str
    kind: str  # machine | vendor | supplier
    name: str
    process: ProcessCode | None = None
    exposed: bool = False


class SpofEdge(_Out):
    from_node: str
    to_node: str
    relation: str  # can_serve | needs


class SpofItem(_Out):
    rank: int
    resource_id: str
    kind: str
    name: str
    orders_broken: list[str]
    steps_broken: list[str]
    revenue_at_risk_inr: float
    exposed: bool = False


class SpofOut(_Out):
    factory_id: str
    items: list[SpofItem]
    nodes: list[SpofNode]
    edges: list[SpofEdge]
    trace: list[TraceEntry] = []