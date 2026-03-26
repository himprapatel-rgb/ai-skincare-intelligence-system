"""Standardized application exceptions with consistent error response format.

All exceptions produce: {"detail": str, "code": str, "status": int}
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class AppException(HTTPException):
    """Base application exception with machine-readable code."""

    def __init__(self, status_code: int, detail: str, code: str):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code

    def to_dict(self) -> dict:
        return {"detail": self.detail, "code": self.code, "status": self.status_code}


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, "NOT_FOUND")


class AuthError(AppException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "AUTH_ERROR")


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "FORBIDDEN")


class ValidationError(AppException):
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "VALIDATION_ERROR")


class RateLimitError(AppException):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, detail, "RATE_LIMIT")


class AIServiceError(AppException):
    def __init__(self, detail: str = "AI service unavailable"):
        super().__init__(status.HTTP_503_SERVICE_UNAVAILABLE, detail, "AI_SERVICE_ERROR")


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status.HTTP_409_CONFLICT, detail, "CONFLICT")


class AccountLockedError(AppException):
    def __init__(self, detail: str = "Account temporarily locked"):
        super().__init__(status.HTTP_423_LOCKED, detail, "ACCOUNT_LOCKED")


# Global exception handlers to register in main.py


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Wrap plain HTTPExceptions into the standard format."""
    code = {
        400: "BAD_REQUEST",
        401: "AUTH_ERROR",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT",
        500: "INTERNAL_ERROR",
        503: "SERVICE_UNAVAILABLE",
    }.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": code, "status": exc.status_code},
    )
