from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class SkinAnalysis(Base):
    __tablename__ = "skin_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String)  # URL from your storage (S3/Cloudinary)
    skin_type = Column(String)
    concerns = Column(JSON)  # Store as ['Acne', 'Redness']
    confidence_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())