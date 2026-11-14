"""M8 relationship schemas: effective status, guarded transitions, checks, reconfirm."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.enums import BackupStatus, CheckKey, EffectiveStatus


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class CheckOut(_Out):
    key: CheckKey
    done: bool
    done_at: datetime | None


class RelationshipOut(_Out):
    id: str
    owner_id: str
    partner_id: str
    status: BackupStatus
    effective_status: EffectiveStatus  # computed at read time; STALE never stored
    last_confirmed_at: datetime | None
    customer_approval_required: bool
    notes: str | None
    checks: list[CheckOut] = []


class StatusPatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: BackupStatus


class ReconfirmOut(_Out):
    id: str
    last_confirmed_at: datetime