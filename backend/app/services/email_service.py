from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from typing import Optional
from urllib.parse import quote_plus

from app.config import settings

logger = logging.getLogger(__name__)


def _build_verification_link(email: str, token: str) -> str:
    email_param = quote_plus(email)
    token_param = quote_plus(token)
    base_url = settings.FRONTEND_URL.rstrip("/")
    return f"{base_url}/verify-email?token={token_param}&email={email_param}"


def _ensure_smtp_configured() -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        raise RuntimeError("SMTP is not configured.")


def send_verification_email(email: str, token: str) -> None:
    _ensure_smtp_configured()
    link = _build_verification_link(email, token)

    message = EmailMessage()
    message["Subject"] = "Verify your AI Skincare account"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Welcome to AI Skincare Intelligence.",
                "",
                "Please verify your email address by clicking the link below:",
                link,
                "",
                "If you did not create an account, you can ignore this email.",
            ]
        )
    )

    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    username: Optional[str] = settings.SMTP_USERNAME
    password: Optional[str] = settings.SMTP_PASSWORD

    try:
        with smtplib.SMTP(host, port) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if username and password:
                server.login(username, password)
            else:
                logger.warning("SMTP credentials missing; skipping email send.")
                return
            server.send_message(message)
    except Exception as exc:
        # Bypass email failures to avoid blocking development flows.
        logger.error("Failed to send verification email: %s", exc)
        return


def _build_password_reset_link(token: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")
    return f"{base_url}/password-reset/confirm?token={token}"


def send_password_reset_email(email: str, token: str) -> None:
    """
    Send password reset email.
    
    SRS: US-103 - Password Reset Flow
    Sprint: GUI-2
    """
    _ensure_smtp_configured()
    link = _build_password_reset_link(token)

    message = EmailMessage()
    message["Subject"] = "Reset your AI Skincare password"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Password Reset Request",
                "",
                "You requested to reset your password for your AI Skincare Intelligence account.",
                "",
                "Click the link below to reset your password:",
                link,
                "",
                "This link will expire in 24 hours.",
                "",
                "If you did not request this reset, you can safely ignore this email.",
                "Your password will remain unchanged.",
            ]
        )
    )

    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    username: Optional[str] = settings.SMTP_USERNAME
    password: Optional[str] = settings.SMTP_PASSWORD

    try:
        with smtplib.SMTP(host, port) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if username and password:
                server.login(username, password)
            else:
                logger.warning("SMTP credentials missing; skipping password reset email.")
                return
            server.send_message(message)
            logger.info("Password reset email sent to %s", email)
    except Exception as exc:
        logger.error("Failed to send password reset email: %s", exc)
        return
