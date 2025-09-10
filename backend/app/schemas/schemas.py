from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    verified: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    role: str
    verified: bool
    created_at: datetime
    total_claims: int = 0
    total_donations: int = 0

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class OrganizationCreate(BaseModel):
    name: str
    type: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    capacity_json: dict = {}


class OrganizationOut(BaseModel):
    id: int
    name: str
    type: str
    address: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    phone: Optional[str]
    email: Optional[str]

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    org_id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    allergens: List[str] = []
    storage_type: Optional[str] = None
    quantity: Optional[float] = None
    ready_at: Optional[Union[str, datetime]] = None
    expires_at: Optional[Union[str, datetime]] = None
    pickup_window: Optional[str] = None
    status: str = "listed"
    photo_url: Optional[str] = None

    @field_validator('ready_at', 'expires_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str) and v.strip():
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                return v
        return v


class ItemOut(BaseModel):
    id: int
    org_id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    storage_type: Optional[str]
    quantity: Optional[float]
    ready_at: Optional[datetime]
    expires_at: Optional[datetime]
    pickup_window: Optional[str]
    status: str
    photo_url: Optional[str]
    claimed_at: Optional[datetime] = None
    
    # Legacy fields (for backward compatibility)
    claimed_by_name: Optional[str] = None
    claimed_by_phone: Optional[str] = None
    claimed_by_email: Optional[str] = None
    
    # New user relationship fields
    claimed_by_user_id: Optional[int] = None
    donated_by_user_id: Optional[int] = None
    
    # Related organization info
    organization: Optional[OrganizationOut] = None

    class Config:
        from_attributes = True


class UserClaimHistory(BaseModel):
    id: int
    item: ItemOut
    claimed_at: datetime
    status: str

    class Config:
        from_attributes = True


class UserDashboard(BaseModel):
    user: UserProfile
    claimed_items: List[ItemOut] = []
    donated_items: List[ItemOut] = []
    recent_activity: List[dict] = []

    class Config:
        from_attributes = True


class ItemClaim(BaseModel):
    claimer_name: str = Field(min_length=2)
    claimer_phone: Optional[str] = None
    claimer_email: Optional[str] = None


class EventCreate(BaseModel):
    event_type: str
    item_id: Optional[int] = None
    org_id: Optional[int] = None
    metadata: dict = {}


class EventOut(BaseModel):
    id: int
    created_at: datetime
    user_id: Optional[int] = None
    item_id: Optional[int] = None
    org_id: Optional[int] = None
    event_type: str
    metadata_json: dict = {}

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_items: int
    total_claimed: int
    total_unclaimed: int
    claim_rate: float
    donors: int
    recipients: int
    items_expiring_next_24h: int

