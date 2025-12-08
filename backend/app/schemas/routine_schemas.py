from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class RoutineProductBase(BaseModel):
    product_id: UUID
    step_order: Optional[int] = None
    notes: Optional[str] = None


class RoutineProductCreate(RoutineProductBase):
    pass


class RoutineProductResponse(RoutineProductBase):
    id: UUID
    class Config:
        from_attributes = True


class SavedRoutineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str]
    routine_type: str = Field("custom")
    is_active: bool = True


class SavedRoutineCreate(SavedRoutineBase):
    products: List[RoutineProductCreate] = []


class SavedRoutineUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    routine_type: Optional[str]
    is_active: Optional[bool]


class SavedRoutineResponse(SavedRoutineBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    products: List[RoutineProductResponse]

    class Config:
        from_attributes = True
