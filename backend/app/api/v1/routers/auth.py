"""
Authentication routes for user registration, login, and profile management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.models import User, Item
from app.schemas.schemas import (
    UserCreate, UserLogin, UserOut, TokenOut, UserProfile, UserDashboard, UserUpdate
)
from app.auth.auth import (
    hash_password, authenticate_user, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserOut)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        password_hash=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=TokenOut)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = authenticate_user(user_data.email, user_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenOut(
        access_token=access_token,
        user=UserOut(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            verified=user.verified
        )
    )


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's profile with statistics"""
    # Count claims and donations
    total_claims = db.query(func.count(Item.id)).filter(Item.claimed_by_user_id == current_user.id).scalar() or 0
    total_donations = db.query(func.count(Item.id)).filter(Item.donated_by_user_id == current_user.id).scalar() or 0
    
    return UserProfile(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        verified=current_user.verified,
        created_at=current_user.created_at,
        total_claims=total_claims,
        total_donations=total_donations
    )


@router.get("/dashboard", response_model=UserDashboard)
def get_user_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's dashboard with claimed and donated items"""
    # Get claimed items
    claimed_items = db.query(Item).filter(Item.claimed_by_user_id == current_user.id).order_by(Item.claimed_at.desc()).limit(10).all()
    
    # Get donated items
    donated_items = db.query(Item).filter(Item.donated_by_user_id == current_user.id).order_by(Item.id.desc()).limit(10).all()
    
    # Generate recent activity
    recent_activity = []
    
    # Add recent claims
    for item in claimed_items[:5]:
        recent_activity.append({
            "type": "claim",
            "message": f"You claimed '{item.title}'",
            "timestamp": item.claimed_at,
            "item_id": item.id
        })
    
    # Add recent donations
    for item in donated_items[:5]:
        recent_activity.append({
            "type": "donation",
            "message": f"You donated '{item.title}'",
            "timestamp": item.ready_at or item.id,  # Fallback to ID for sorting
            "item_id": item.id
        })
    
    # Sort by timestamp
    recent_activity.sort(key=lambda x: x["timestamp"] if x["timestamp"] else 0, reverse=True)
    recent_activity = recent_activity[:10]  # Keep only 10 most recent
    
    # Count totals
    total_claims = len(claimed_items)
    total_donations = len(donated_items)
    
    user_profile = UserProfile(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        verified=current_user.verified,
        created_at=current_user.created_at,
        total_claims=total_claims,
        total_donations=total_donations
    )
    
    return UserDashboard(
        user=user_profile,
        claimed_items=claimed_items,
        donated_items=donated_items,
        recent_activity=recent_activity
    )


@router.put("/me", response_model=UserProfile)
def update_current_user_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile (name, phone, optional password)"""
    if updates.name is not None:
        current_user.name = updates.name
    if updates.phone is not None:
        current_user.phone = updates.phone
    if updates.password:
        current_user.password_hash = hash_password(updates.password)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    # Recompute quick stats
    total_claims = db.query(func.count(Item.id)).filter(Item.claimed_by_user_id == current_user.id).scalar() or 0
    total_donations = db.query(func.count(Item.id)).filter(Item.donated_by_user_id == current_user.id).scalar() or 0

    return UserProfile(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        verified=current_user.verified,
        created_at=current_user.created_at,
        total_claims=total_claims,
        total_donations=total_donations,
    )