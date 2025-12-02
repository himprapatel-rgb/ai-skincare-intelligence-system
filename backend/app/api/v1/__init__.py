from fastapi import APIRouter
<<<<<<< HEAD
from app.api.v1.endpoints import internal

api_router = APIRouter()

api_router.include_router(
	internal.router,
	prefix="/internal",
	tags=["Internal"]
=======
from app.api.v1.endpoints import auth


api_router = APIRouter()


api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
>>>>>>> 1304539fc882303eaeec88764f826cdafdfb4ea2
)
