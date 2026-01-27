#!/usr/bin/env python3
"""
Quick test script to verify SMTP email configuration.
Run with: python test_email.py your_email@example.com
"""
import sys
import os

# Add the app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

def test_smtp_config():
    """Check if SMTP is configured."""
    print("=" * 50)
    print("SMTP Configuration Check")
    print("=" * 50)
    
    config = {
        "SMTP_HOST": settings.SMTP_HOST,
        "SMTP_PORT": settings.SMTP_PORT,
        "SMTP_USERNAME": settings.SMTP_USERNAME,
        "SMTP_PASSWORD": "***" if settings.SMTP_PASSWORD else None,
        "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
        "SMTP_USE_TLS": settings.SMTP_USE_TLS,
        "FRONTEND_URL": settings.FRONTEND_URL,
    }
    
    for key, value in config.items():
        status = "[OK]" if value else "[MISSING]"
        print(f"{status} {key}: {value}")
    
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]):
        print("\n[ERROR] SMTP not fully configured!")
        print("\nRequired environment variables:")
        print("  SMTP_HOST=smtp.gmail.com")
        print("  SMTP_PORT=587")
        print("  SMTP_USERNAME=your_email@gmail.com")
        print("  SMTP_PASSWORD=your_app_password")
        print("  SMTP_FROM_EMAIL=your_email@gmail.com")
        return False
    
    print("\n[OK] SMTP configuration looks complete!")
    return True


def test_send_email(to_email: str):
    """Send a test email."""
    from app.services.email_service import send_verification_email
    
    print(f"\nSending test verification email to: {to_email}")
    print("-" * 50)
    
    try:
        # Generate a test token
        test_token = "test-verification-token-12345"
        
        send_verification_email(to_email, test_token)
        print("[OK] Email sent successfully!")
        print(f"\nCheck your inbox at {to_email}")
        print("The email should contain a verification link.")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        return False


def main():
    # Always check config first
    config_ok = test_smtp_config()
    
    if len(sys.argv) < 2:
        print("\n" + "=" * 50)
        print("To send a test email, run:")
        print("  python test_email.py your_email@example.com")
        if not config_ok:
            sys.exit(1)
        sys.exit(0)
    
    to_email = sys.argv[1]
    
    if not config_ok:
        sys.exit(1)
    
    # Send test email
    if test_send_email(to_email):
        print("\n[SUCCESS] Email test successful!")
    else:
        print("\n[FAILED] Email test failed. Check the error message above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
