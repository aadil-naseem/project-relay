"""M2 routers: passport extraction, manual create, review, confirm, RFQ, sharing."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, UploadFile
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.passports import (
    ExtractResponse,
    PassportOut,
    PassportPatch,
    RfqOut,
    ShareIn,
)
from app.services import passport as service

router = APIRouter(tags=["passports"])


class ManualCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fields: dict


@router.post("/passports/extract", response_model=ExtractResponse)
async def post_extract(
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
):
    data = await file.read()
    if not data:
        from app.errors import AppError

        raise AppError("VALIDATION_ERROR", "Uploaded file is empty.", status_code=422)
    result = service.extract(session, data, file.filename or "upload", file.content_type)
    return ExtractResponse.model_validate(result)


@router.post("/passports/manual", response_model=PassportOut, status_code=201)
def post_manual(payload: ManualCreate, session: Session = Depends(get_db)):
    return PassportOut.model_validate(service.manual_create(session, payload.fields))


@router.get("/passports/{passport_id}", response_model=PassportOut)
def get_passport(
    passport_id: str,
    partner_id: str | None = Query(default=None),
    session: Session = Depends(get_db),
):
    if partner_id is not None:
        # partner view needs FULL consent (RFQ-level partners get the RFQ only)
        from sqlalchemy import select

        from app.enums import ShareLevel
        from app.models import PassportShare

        share_row = session.scalars(
            select(PassportShare).where(
                PassportShare.passport_id == passport_id, PassportShare.partner_id == partner_id
            )
        ).first()
        if share_row is None or share_row.level != ShareLevel.FULL:
            from app.errors import AppError

            raise AppError(
                "FORBIDDEN",
                f"Partner {partner_id!r} may fetch only the RFQ without FULL consent.",
                status_code=403,
            )
    return PassportOut.model_validate(service.passport_out(session, service._get(session, passport_id)))


@router.patch("/passports/{passport_id}", response_model=PassportOut)
def patch_passport(passport_id: str, payload: PassportPatch, session: Session = Depends(get_db)):
    return PassportOut.model_validate(service.patch(session, passport_id, payload.data))


@router.post("/passports/{passport_id}/confirm", response_model=PassportOut)
def post_confirm(
    passport_id: str,
    factory_id: str | None = Query(default=None),
    session: Session = Depends(get_db),
):
    return PassportOut.model_validate(service.confirm(session, passport_id, factory_id))


@router.get("/passports/{passport_id}/rfq", response_model=RfqOut)
def get_rfq(
    passport_id: str,
    partner_id: str | None = Query(default=None),
    session: Session = Depends(get_db),
):
    return RfqOut.model_validate(service.rfq_out(session, passport_id, partner_id))


@router.post("/passports/{passport_id}/share", status_code=201)
def post_share(passport_id: str, payload: ShareIn, session: Session = Depends(get_db)):
    return service.share(session, passport_id, payload.partner_id, payload.level)