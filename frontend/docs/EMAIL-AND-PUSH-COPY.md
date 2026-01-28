# Email & Push Notification Copy (Tasks 248, 249)

## Email (Task 248)

When the app or backend sends email (e.g. password reset, verification), use consistent subject lines and body copy.

| Flow | Subject line | Body (short) |
|------|--------------|--------------|
| Password reset | Reset your SkinCareAI password | You requested a password reset. Click the link below to set a new password. If you didn't request this, ignore this email. |
| Email verification | Verify your SkinCareAI account | Thanks for signing up. Click the link below to verify your email and get started. |
| Contact form receipt (if sent) | We received your message | Thanks for reaching out. We'll respond within 24 hours. |

*Email sending is handled by the backend; this doc is the single source of suggested copy for templates.*

## Push notifications (Task 249)

Push notifications are not yet implemented in the app. When added, use friendly, concise copy:

- **Routine reminder:** "Time for your skincare routine 🌙"
- **Scan reminder:** "Ready for your next skin check? Take a quick scan."
- **Progress:** "Your skin score improved! View your progress."
- **Tip:** "New tip: How to layer actives safely."

*Keep titles under ~50 characters; body under ~120 characters where possible.*
