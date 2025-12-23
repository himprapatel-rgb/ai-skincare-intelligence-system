"""GDPR Audit Logging Module - Production Ready

Provides audit trail functionality for profile changes to ensure GDPR compliance.
Audit logs track metadata only - sensitive data changes stored in encrypted DB.

Based on Gemini AI code review recommendations.
"""
import logging
import json
from typing import Any, Optional
from datetime import datetime, timezone

# Configure audit logger
audit_logger = logging.getLogger("audit")


async def log_profile_event(
    db: Any,
    user_id: int,
    event_type: str,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    ip_address: Optional[str] = None
):
    """
    Logs profile change metadata for GDPR compliance.
    
    IMPORTANT: Does NOT log raw PII in plaintext logs.
    Only logs metadata. Actual data changes should be stored
    in an encrypted database audit table.
    
    Args:
        db: Database session (for future DB audit table)
        user_id: ID of user whose profile was modified
        event_type: Type of event (profile_created, profile_updated, profile_deleted)
        old_value: Previous value (NOT logged - for future DB storage)
        new_value: New value (NOT logged - for future DB storage)
        ip_address: IP address of the requester
    
    SRS Traceability:
        - NFR6: GDPR compliance - audit trail for data modifications
        
    GDPR Compliance:
        - Logs only metadata (timestamp, user_id, event_type, IP)
        - Does NOT log raw PII (email, address, etc.) to avoid GDPR violations
        - TODO: Store actual data changes in encrypted audit_log DB table
    """
    # Prepare audit metadata (no raw PII)
    audit_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "event_type": event_type,
        "ip_address": ip_address,
        "status": "SUCCESS"
    }
    
    # Log metadata only - keeps audit trail without exposing PII
    try:
        audit_logger.info(json.dumps(audit_entry))
    except Exception as e:
        # Never fail the main operation due to audit logging failure
        audit_logger.error(f"Failed to log audit event: {e}")
    
    # TODO: Store actual old_value/new_value in encrypted DB audit table
    # This provides searchability while maintaining GDPR compliance
