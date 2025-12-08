from sqlalchemy.orm import relationship
from sqlalchemy import Column, Text, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.database import Base


class RoutineProduct(Base):
    __tablename__ = "routine_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    routine_id = Column(UUID(as_uuid=True), ForeignKey("saved_routines.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)

    step_order = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    routine = relationship("SavedRoutine", back_populates="products")
    product = relationship("Product")
