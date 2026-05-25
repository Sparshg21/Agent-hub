"""SQLAlchemy models for AgentHub."""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer
from sqlalchemy.sql import func
from database import Base
import uuid


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, default="default_user")
    service = Column(String, nullable=False)       # e.g. "zomato", "flight", "blinkit"
    action = Column(String, nullable=False)        # e.g. "order_food", "book_flight"
    intent = Column(Text)                          # Raw user request
    status = Column(String, default="pending")     # pending | confirmed | completed | cancelled | failed
    details = Column(Text)                         # JSON string of action details
    amount = Column(Float, nullable=True)          # Transaction amount if any
    confirmation_required = Column(Boolean, default=False)
    confirmed_by_user = Column(Boolean, nullable=True)
    result = Column(Text, nullable=True)           # JSON result from service
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, unique=True, default="default_user")
    max_spend_per_action = Column(Float, default=2000.0)    # INR
    require_confirmation_above = Column(Float, default=500.0)  # INR
    enabled_services = Column(Text, default='["zomato","swiggy","blinkit","zepto","flights","utilities","calendar"]')
    blackout_categories = Column(Text, default='[]')
    preferred_payment = Column(String, default="UPI")
    name = Column(String, default="User")
    phone = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
