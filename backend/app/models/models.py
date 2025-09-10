from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Float,
    JSON,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    role: Mapped[str] = mapped_column(String(32), default="user")  # user, donor, admin
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    claimed_items = relationship("Item", foreign_keys="Item.claimed_by_user_id", back_populates="claimed_by_user")
    donated_items = relationship("Item", foreign_keys="Item.donated_by_user_id", back_populates="donated_by_user")


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(String(255))
    lat: Mapped[Optional[float]] = mapped_column(Float)
    lng: Mapped[Optional[float]] = mapped_column(Float)
    phone: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    email: Mapped[Optional[str]] = mapped_column(String(255), default=None)
    capacity_json = Column(JSON, default={})
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)

    items = relationship("Item", back_populates="organization")


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    org_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    allergens_json = Column(JSON, default=list)
    storage_type: Mapped[Optional[str]] = mapped_column(String(50))
    quantity: Mapped[Optional[float]] = mapped_column(Float)
    ready_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pickup_window: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(32), default="listed")
    photo_url: Mapped[Optional[str]] = mapped_column(String(512))
    
    # Legacy fields (for backward compatibility)
    claimed_by_name: Mapped[Optional[str]] = mapped_column(String(100), default=None)
    claimed_by_phone: Mapped[Optional[str]] = mapped_column(String(32), default=None)
    claimed_by_email: Mapped[Optional[str]] = mapped_column(String(255), default=None)
    claimed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=None)
    
    # New user relationships
    claimed_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    donated_by_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)

    # Relationships
    organization = relationship("Organization", back_populates="items")
    claimed_by_user = relationship("User", foreign_keys=[claimed_by_user_id], back_populates="claimed_items")
    donated_by_user = relationship("User", foreign_keys=[donated_by_user_id], back_populates="donated_items")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Actor/context
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    item_id: Mapped[Optional[int]] = mapped_column(ForeignKey("items.id"), nullable=True, index=True)
    org_id: Mapped[Optional[int]] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)

    # Event data
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    metadata_json = Column(JSON, default=dict)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


