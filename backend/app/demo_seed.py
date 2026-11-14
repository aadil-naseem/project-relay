"""Demo world seeder (blueprint section 9, Phase 3).

Reads `backend/data/seed/*.json`, converts relative times (`due_in_days`,
`last_confirmed_days_ago`) to absolute dates against the current clock, and
loads everything with `is_sample = True` (R9). `reset_demo()` drops and
recreates the schema, seeds, and writes the initial readiness snapshot row so
the demo has a clean, reproducible state - `POST /demo/reset` (Phase 13) calls
this same function.

The clock comes from app.core.clock, so tests freezing the clock get dates
relative to the frozen time - data never goes stale relative to "now".
"""

from __future__ import annotations

import json
import logging
from datetime import timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.clock import now
from app.db import Base, engine
from app.enums import (
    BackupStatus,
    CheckKey,
    ProcessCode,
    Role,
    VendorKind,
)
from app.models import (
    AppState,
    BackupRelationship,
    Factory,
    Machine,
    Order,
    Part,
    PartStep,
    Passport,
    PassportShare,
    ReadinessSnapshot,
    RelationshipCheck,
    Rfq,
    Vendor,
    VendorLink,
)

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).resolve().parents[1] / "data" / "seed"
SEED_VERSION = 1
INITIAL_SNAPSHOT_ID = "rdy_initial"

_FILES = ("factories", "vendors", "machines", "parts", "orders", "relationships")

EXPECTED_COUNTS = {
    "factories": 7,  # 1 owner + 6 partners
    "vendors": 2,  # 1 vendor + 1 supplier
    "vendor_links": 2,
    "machines": 32,
    "parts": 6,
    "part_steps": 12,
    "orders": 8,
    "relationships": 6,
    "relationship_checks": 30,
}


def _load(name: str) -> dict[str, Any]:
    with (SEED_DIR / f"{name}.json").open(encoding="utf-8") as handle:
        return json.load(handle)


def load_seed_data() -> dict[str, Any]:
    """Read and sanity-check all seed files (fail fast on wrong shape)."""
    data = {name: _load(name) for name in _FILES}
    total = len(data["factories"]["factories"])
    partners = [f for f in data["factories"]["factories"] if f["role"] == "PARTNER"]
    if not total or not partners:
        raise ValueError("seed factories.json must contain an owner and partners")
    return data


def _wipe(session: Session) -> None:
    """Delete seed-managed rows (FK-safe) so seed() can run repeatedly.

    Prefetch data (hazard_zones, site_terrain, routes) and runtime tables
    (exposure, stress, recovery) are NOT touched - only reset_demo() rebuilds
    the whole schema.
    """
    from sqlalchemy import delete

    for table in (
        RelationshipCheck,
        BackupRelationship,
        PassportShare,
        Rfq,
        Passport,
        Order,
        PartStep,
        Part,
        Machine,
        VendorLink,
        Vendor,
        Factory,
    ):
        session.execute(delete(table))
    session.execute(delete(AppState).where(AppState.key == "demo"))


def _seed(session: Session) -> dict[str, int]:
    data = load_seed_data()
    _wipe(session)
    current = now()

    factories: dict[str, Factory] = {}
    for row in data["factories"]["factories"]:
        factory = Factory(
            id=row["id"],
            role=Role(row["role"]),
            name=row["name"],
            is_sample=True,
            lat=row["lat"],
            lon=row["lon"],
            cluster_id=row["cluster_id"],
            hazard_zone_id=row.get("hazard_zone_id"),
            grid_id=row.get("grid_id"),
            shift_hours_per_day=row.get("shift_hours_per_day", 16.0),
            materials_handled=row.get("materials_handled", []),
            typical_lead_time_hours=row.get("typical_lead_time_hours"),
            mobilisation_hours=row.get("mobilisation_hours"),
            spare_hours_per_week=row.get("spare_hours_per_week", {}),
            contacts=row.get("contacts", []),
        )
        factories[factory.id] = factory
    session.add_all(factories.values())

    vendors: dict[str, Vendor] = {}
    for row in data["vendors"]["vendors"]:
        vendor = Vendor(
            id=row["id"],
            kind=VendorKind(row["kind"]),
            name=row["name"],
            is_sample=True,
            lat=row["lat"],
            lon=row["lon"],
            cluster_id=row["cluster_id"],
            hazard_zone_id=row.get("hazard_zone_id"),
            grid_id=row.get("grid_id"),
            process=ProcessCode(row["process"]) if row.get("process") else None,
            material=row.get("material"),
            turnaround_hours=row.get("turnaround_hours", 24.0),
        )
        vendors[vendor.id] = vendor
    session.add_all(vendors.values())
    session.add_all(
        VendorLink(factory_id=link["factory_id"], vendor_id=link["vendor_id"])
        for link in data["vendors"]["vendor_links"]
    )

    for row in data["machines"]["machines"]:
        session.add(
            Machine(
                id=row["id"],
                factory_id=row["factory_id"],
                process=ProcessCode(row["process"]),
                name=row["name"],
                achievable_tolerance_mm=row.get("achievable_tolerance_mm"),
                envelope_mm=row.get("envelope_mm"),
            )
        )

    for row in data["parts"]["parts"]:
        part = Part(
            id=row["id"],
            factory_id=row["factory_id"],
            name=row["name"],
            drawing_no=row.get("drawing_no"),
            customer_alias=row.get("customer_alias"),
            material=row["material"],
            is_critical=row.get("is_critical", False),
            typical_batch_qty=row.get("typical_batch_qty", 1),
        )
        session.add(part)
        for step in row["steps"]:
            session.add(
                PartStep(
                    id=f"st_{row['id']}_{step['seq']}",
                    part_id=part.id,
                    seq=step["seq"],
                    process=ProcessCode(step["process"]),
                    hours_per_unit=step.get("hours_per_unit", 0.0),
                    setup_hours=step.get("setup_hours", 0.0),
                    tolerance_mm=step.get("tolerance_mm"),
                    outsourced=step.get("outsourced", False),
                )
            )

    for row in data["orders"]["orders"]:
        session.add(
            Order(
                id=row["id"],
                factory_id="fac_owner",
                part_id=row["part_id"],
                qty=row["qty"],
                due_at=current + timedelta(days=row["due_in_days"]),
                value_inr=row["value_inr"],
                customer_alias=row.get("customer_alias"),
            )
        )

    for row in data["relationships"]["relationships"]:
        confirmed = (
            current - timedelta(days=row["last_confirmed_days_ago"])
            if row.get("last_confirmed_days_ago") is not None
            else None
        )
        relationship = BackupRelationship(
            id=row["id"],
            owner_id=row["owner_id"],
            partner_id=row["partner_id"],
            status=BackupStatus(row["status"]),
            last_confirmed_at=confirmed,
            customer_approval_required=row.get("customer_approval_required", True),
            notes=row.get("notes"),
        )
        session.add(relationship)
        for check in row["checks"]:
            done = bool(check["done"])
            session.add(
                RelationshipCheck(
                    id=f"chk_{row['id']}_{check['key']}",
                    relationship_id=relationship.id,
                    key=CheckKey(check["key"]),
                    done=done,
                    done_at=current if done else None,
                )
            )

    session.add(AppState(key="demo", value={"seed_version": SEED_VERSION}))
    session.flush()

    counts = {
        "factories": len(factories),
        "vendors": len(vendors),
        "vendor_links": len(data["vendors"]["vendor_links"]),
        "machines": len(data["machines"]["machines"]),
        "parts": len(data["parts"]["parts"]),
        "part_steps": sum(len(p["steps"]) for p in data["parts"]["parts"]),
        "orders": len(data["orders"]["orders"]),
        "relationships": len(data["relationships"]["relationships"]),
        "relationship_checks": sum(len(r["checks"]) for r in data["relationships"]["relationships"]),
    }
    for table, expected in EXPECTED_COUNTS.items():
        if counts[table] != expected:
            raise ValueError(f"seed count mismatch for {table}: {counts[table]} != {expected}")
    return counts


def seed(session: Session) -> dict[str, int]:
    """Seed into the existing (empty or wipeable) schema."""
    return _seed(session)


def reset_demo() -> dict[str, int]:
    """Drop and recreate the schema, seed, and write the initial readiness snapshot.

    Used by `scripts/reset_demo.py` and later by `POST /demo/reset` (Phase 13).
    """
    logger.info("resetting demo world (drop + create + seed)")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        counts = _seed(session)
        session.add(
            ReadinessSnapshot(
                id=INITIAL_SNAPSHOT_ID,
                factory_id="fac_owner",
                window_hours=48,
                score=0.0,
                weighted_score=0.0,
                breakdown={},
                reason="INITIAL - not yet computed (M8 fills this on first run)",
            )
        )
        session.commit()
    return counts


def verify_counts(session: Session) -> dict[str, int]:
    """Row counts straight from the database, for tests and the done-when check."""
    return {
        "factories": len(session.scalars(select(Factory)).all()),
        "vendors": len(session.scalars(select(Vendor)).all()),
        "vendor_links": len(session.scalars(select(VendorLink)).all()),
        "machines": len(session.scalars(select(Machine)).all()),
        "parts": len(session.scalars(select(Part)).all()),
        "part_steps": len(session.scalars(select(PartStep)).all()),
        "orders": len(session.scalars(select(Order)).all()),
        "relationships": len(session.scalars(select(BackupRelationship)).all()),
        "relationship_checks": len(session.scalars(select(RelationshipCheck)).all()),
    }


__all__ = [
    "EXPECTED_COUNTS",
    "INITIAL_SNAPSHOT_ID",
    "SEED_DIR",
    "SEED_VERSION",
    "load_seed_data",
    "reset_demo",
    "seed",
    "verify_counts",
]
