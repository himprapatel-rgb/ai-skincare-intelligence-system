""" 
User database model with comprehensive profile fields.
"""
from sqlalchemy import Column, ForeignKey, String, Boolean, DateTime, Integer, Date, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    """User model for authentication and profile management."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(
        String, unique=True, index=True, default=lambda: str(uuid.uuid4())
    )
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    scan_sessions = relationship("ScanSession", back_populates="user", cascade="all, delete-orphan")
    skin_snapshots = relationship("SkinStateSnapshot", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consents = relationship("UserConsent", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class UserConsent(Base):
    """User consent records for GDPR compliance."""
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    terms_accepted = Column(Boolean, default=False)
    privacy_accepted = Column(Boolean, default=False)
    terms_version = Column(String, nullable=False)
    privacy_version = Column(String, nullable=False)
    accepted_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)

    # Relationship
    user = relationship("User", back_populates="consents", foreign_keys=[user_id])

    def __repr__(self):
        return f"<UserConsent user_id={self.user_id}>"


class PolicyVersion(Base):
    """Policy version tracking for Terms of Service and Privacy Policy."""
    __tablename__ = "policy_versions"

    id = Column(Integer, primary_key=True, index=True)
    policy_type = Column(String, nullable=False, index=True)  # "terms_of_service" or "privacy_policy"
    version = Column(String, nullable=False, unique=True)
    effective_date = Column(DateTime(timezone=True), nullable=False)
    content_url = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<PolicyVersion {self.policy_type} v{self.version}>"


class UserProfile(Base):
    """Comprehensive user profile for skincare goals, preferences, and personalization."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # ===== PERSONAL INFORMATION =====
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)  # male, female, non-binary, prefer-not-to-say
    location = Column(String(255), nullable=True)
    timezone = Column(String(50), nullable=True)
    phone_number = Column(String(20), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    
    # ===== SKIN PROFILE =====
    skin_type = Column(String(50), nullable=True)  # oily, dry, combination, normal, sensitive
    skin_tone = Column(String(50), nullable=True)  # fair, light, medium, olive, tan, deep
    skin_texture = Column(String(50), nullable=True)  # smooth, rough, bumpy, uneven
    pore_size = Column(String(20), nullable=True)  # small, medium, large
    moisture_level = Column(String(20), nullable=True)  # low, normal, high
    oil_production = Column(String(20), nullable=True)  # low, normal, high
    sensitivity_level = Column(String(20), nullable=True)  # low, medium, high
    primary_concern = Column(String(100), nullable=True)
    secondary_concerns = Column(JSON, nullable=True)  # Array of concerns
    
    # ===== LIFESTYLE & ENVIRONMENTAL =====
    sun_exposure = Column(String(20), nullable=True)  # minimal, moderate, frequent
    outdoor_activity_level = Column(String(20), nullable=True)  # low, moderate, high
    water_intake = Column(Integer, nullable=True)  # glasses per day
    sleep_hours = Column(Float, nullable=True)  # average hours
    diet_type = Column(String(50), nullable=True)  # balanced, vegetarian, vegan, etc.
    stress_level = Column(String(20), nullable=True)  # low, moderate, high
    exercise_frequency = Column(String(50), nullable=True)  # daily, 3-5x/week, etc.
    smoking_status = Column(String(20), nullable=True)  # never, former, current
    alcohol_consumption = Column(String(20), nullable=True)  # none, occasional, moderate, frequent
    climate = Column(String(50), nullable=True)  # humid, dry, tropical, temperate, cold
    
    # ===== MEDICAL & HISTORY =====
    known_allergies = Column(JSON, nullable=True)  # Array of allergies
    current_medications = Column(JSON, nullable=True)  # Array of medications
    skin_conditions = Column(JSON, nullable=True)  # Array: acne, eczema, rosacea, psoriasis, etc.
    previous_treatments = Column(Text, nullable=True)  # Free text for treatment history
    
    # ===== PREFERENCES =====
    preferred_ingredients = Column(JSON, nullable=True)  # Array of preferred ingredients
    ingredients_to_avoid = Column(JSON, nullable=True)  # Array of ingredients to avoid
    product_texture_preference = Column(String(50), nullable=True)  # gel, cream, serum, oil, lotion
    fragrance_preference = Column(String(30), nullable=True)  # fragrance-free, light, any
    budget_range = Column(String(30), nullable=True)  # budget, mid-range, premium, luxury
    brand_preferences = Column(JSON, nullable=True)  # Array of preferred brands
    
    # ===== SKINCARE ROUTINE =====
    routine_frequency = Column(String(50), nullable=True)  # morning-only, evening-only, both, occasional
    current_routine_products = Column(JSON, nullable=True)  # Array of current products
    
    # ===== GOALS =====
    goals = Column(JSON, nullable=True)  # Array of skincare goals
    
    # ===== NOTIFICATION PREFERENCES =====
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    marketing_emails = Column(Boolean, default=False)
    
    # ===== PRIVACY SETTINGS =====
    profile_visibility = Column(String(20), default="private")  # private, friends, public
    share_progress = Column(Boolean, default=False)
    allow_data_analysis = Column(Boolean, default=True)
    
    # ===== METADATA =====
    profile_complete = Column(Boolean, default=False)
    completion_percentage = Column(Integer, default=0)
    last_profile_update = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile user_id={self.user_id}>"

    def calculate_completion(self):
        """Calculate profile completion percentage based on filled fields."""
        important_fields = [
            'first_name', 'last_name', 'date_of_birth', 'gender',
            'skin_type', 'skin_tone', 'primary_concern',
            'sun_exposure', 'water_intake', 'sleep_hours',
            'goals', 'routine_frequency'
        ]
        filled = sum(1 for field in important_fields if getattr(self, field) is not None)
        return int((filled / len(important_fields)) * 100)
