"""GIS parcels — list with district / survey-village query / record filters.

Each parcel is enriched with geography names and its linked land record, so the
map UI can style parcels by verification status and conflict state.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import GisParcel, User
from ..serializers import gis_parcel_dict

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


@router.get("")
def list_parcels(
    district: str | None = None,
    query: str | None = None,
    recordId: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    parcels = db.scalars(select(GisParcel)).all()
    result = []
    for p in parcels:
        d = gis_parcel_dict(db, p)
        if district and d["district"] != district:
            continue
        if query:
            q = query.strip().lower()
            if q not in d["surveyNumber"].lower() and q not in d["village"].lower():
                continue
        if recordId and d["recordId"] != recordId:
            continue
        result.append(d)
    return result