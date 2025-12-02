from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base

class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    terms_accepted = Column(Boolean, default=False)
    privacy_accepted = Column(Boolean, default=False)
    data_processing_accepted = Column(Boolean, default=False)
    marketing_accepted = Column(Boolean, default=False)
    analytics_accepted = Column(Boolean, default=False)
    consent_version = Column(String, nullable=False)
    user_agent = Column(Text)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String, nullable=False)  # "accept" or "decline"

    def __repr__(self):
        return f"<ConsentLog user_id={self.user_id} action={self.action} version={self.consent_version}>"
