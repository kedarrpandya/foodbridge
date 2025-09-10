from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from typing import Union, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Item, Organization, User
from app.schemas.schemas import ItemCreate, ItemOut, ItemClaim
from app.models.models import Event
from app.auth.auth import get_current_user, get_current_user_optional
from app.services.email import send_claim_notification_to_claimer, send_claim_notification_to_donor
import os
import shutil
from pathlib import Path
from datetime import datetime


router = APIRouter(prefix="/items", tags=["items"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/", response_model=ItemOut)
def create_item(
    payload: ItemCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    item = Item(
        org_id=payload.org_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        allergens_json=payload.allergens,
        storage_type=payload.storage_type,
        quantity=payload.quantity,
        ready_at=payload.ready_at,
        expires_at=payload.expires_at,
        pickup_window=payload.pickup_window,
        status=payload.status,
        photo_url=payload.photo_url,
        donated_by_user_id=current_user.id if current_user else None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=list[ItemOut])
def list_items(
    db: Session = Depends(get_db),
    status: Union[str, None] = Query(None),
    q: Union[str, None] = Query(None, description="Search in title/description"),
    limit: int = Query(50, ge=1, le=200),
):
    query = db.query(Item)
    if status:
        query = query.filter(Item.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter((Item.title.ilike(like)) | (Item.description.ilike(like)))
    return query.order_by(Item.expires_at.is_(None), Item.expires_at.asc(), Item.id.desc()).limit(limit).all()


@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file and return the local path"""
    if not file.content_type.startswith('image/'):
        return {"error": "File must be an image"}
    
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{os.urandom(8).hex()}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"image_url": f"/uploads/{filename}"}


@router.post("/{item_id}/claim", response_model=ItemOut)
def claim_item(
    item_id: int, 
    claim_data: ItemClaim, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Claim an available food item"""
    # Get the item and organization
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    organization = db.query(Organization).filter(Organization.id == item.org_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if item is still available
    if item.status != "listed":
        raise HTTPException(status_code=400, detail="Item is no longer available")
    
    # Update item with claimer information
    item.status = "claimed"
    item.claimed_by_name = claim_data.claimer_name
    item.claimed_by_phone = claim_data.claimer_phone
    item.claimed_by_email = claim_data.claimer_email
    item.claimed_at = datetime.utcnow()
    item.claimed_by_user_id = current_user.id if current_user else None
    
    db.commit()
    db.refresh(item)
    
    # Send email notifications
    try:
        # Determine receiver email (form email or logged-in user's email)
        claimer_email_to = claim_data.claimer_email or (current_user.email if current_user and current_user.email else None)
        claimer_name = claim_data.claimer_name or (current_user.name if current_user and current_user.name else "Recipient")

        # Send notification to claimer (receiver)
        if claimer_email_to:
            send_claim_notification_to_claimer(
                item=item,
                organization=organization,
                claimer_email=claimer_email_to,
                claimer_name=claimer_name
            )
        
        # Send notification to donor/organization
        send_claim_notification_to_donor(
            item=item,
            organization=organization,
            claimer_email=claim_data.claimer_email or "No email provided",
            claimer_name=claim_data.claimer_name,
            claimer_phone=claim_data.claimer_phone
        )
    except Exception as e:
        # Log error but don't fail the claim
        print(f"Email notification failed: {e}")
    
    # Log event
    try:
        event = Event(
            user_id=current_user.id if current_user else None,
            item_id=item.id,
            org_id=item.org_id,
            event_type="item_claimed",
            metadata_json={
                "claimer_name": claim_data.claimer_name,
                "claimer_phone": claim_data.claimer_phone,
                "claimer_email": claim_data.claimer_email,
            },
        )
        db.add(event)
        db.commit()
    except Exception as e:
        print(f"Event log failed: {e}")

    return item


@router.get("/{item_id}", response_model=ItemOut)
def get_item_details(item_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific item including pickup details"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


