
    user_feedback = Column(String(20), nullable=True)  # better/same/worse
    notes = Column(Text, nullable=True)
    
    # Timestamps
    added_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="products")
    
    __table_args__ = (
        Index('idx_product_user_active', 'user_id', 'is_active'),
    )


class Ingredient(Base):
    """Master ingredient database - safety profiles and evidence"""
    
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    name_inci = Column(String(255), nullable=False, unique=True, index=True)  # INCI standard name
    common_names = Column(JSONB, default=list)  # Alternative names
    
    # Classification
    category = Column(String(100), nullable=True)  # surfactant, emollient, active, etc.
    function = Column(Text, nullable=True)  # What it does
    
    # Safety profile
    safety_category = Column(String(50), nullable=True)  # Safe, Irritant, Allergen, Comedogenic
    safety_evidence = Column(JSONB, nullable=True)  # Multiple sources with evidence level
    comedogenic_rating = Column(Integer, nullable=True)  # 0-5 scale
    
    # Microbiome impact
    microbiome_impact = Column(String(50), nullable=True)  # Low/Medium/High disruption
    is_antimicrobial = Column(Integer, default=0)
    
    # Regulatory
    regulatory_notes = Column(Text, nullable=True)  # EU/FDA/CIR notes
    
    # Sources
    data_sources = Column(JSONB, nullable=True)  # EWG, CosIng, INCIDecoder, etc.
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
