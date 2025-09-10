from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Organization
from app.schemas.schemas import OrganizationCreate, OrganizationOut


router = APIRouter(prefix="/orgs", tags=["organizations"])


@router.post("/", response_model=OrganizationOut)
def create_org(payload: OrganizationCreate, db: Session = Depends(get_db)):
    org = Organization(
        name=payload.name,
        type=payload.type,
        address=payload.address,
        lat=payload.lat,
        lng=payload.lng,
        phone=payload.phone,
        email=payload.email,
        capacity_json=payload.capacity_json,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.get("/", response_model=list[OrganizationOut])
def list_orgs(db: Session = Depends(get_db)):
    return db.query(Organization).order_by(Organization.id.desc()).limit(100).all()


