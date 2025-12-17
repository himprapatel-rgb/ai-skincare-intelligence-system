from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
from sqlalchemy.sql import func
from app.core import Base


class SCINSample(Base):
    """SCIN (Skin Condition Image Network) dataset sample model"""
    
    __tablename__ = "scin_samples"

    id = Column(Integer, primary_key=True, index=True)
    
    # Image paths
    image_1_path = Column(Text, nullable=True)
    image_2_path = Column(Text, nullable=True)
    image_3_path = Column(Text, nullable=True)
    
    # Image binary data (stored as base64 in PostgreSQL)
    image_1_data = Column(Text, nullable=True)  # Base64 encoded
    image_2_data = Column(Text, nullable=True)  # Base64 encoded
    image_3_data = Column(Text, nullable=True)  # Base64 encoded
    
    # Core metadata
    md5hash = Column(String(255), unique=True, index=True)
    three_partition_label = Column(String(255), nullable=True)
    fitzpatrick_scale = Column(String(50), nullable=True)
    fitzpatrick_label = Column(String(255), nullable=True)
    
    # Diagnosis information
    diagnosis = Column(String(500), nullable=True)
    diagnosis_label = Column(String(500), nullable=True)
    
    # Additional metadata
    url = Column(Text, nullable=True)
    iddx_1 = Column(String(255), nullable=True)
    iddx_2 = Column(String(255), nullable=True)
    iddx_3 = Column(String(255), nullable=True)
    iddx_full = Column(Text, nullable=True)
    
    # Model fields
    model_trained = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SCINSample(id={self.id}, diagnosis={self.diagnosis}, fitzpatrick={self.fitzpatrick_scale})>"
