from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.saved_routine import SavedRoutine
from app.models.routine_product import RoutineProduct
from app.schemas.routine_schemas import (
    SavedRoutineCreate,
    SavedRoutineUpdate,
    SavedRoutineResponse,
)

router = APIRouter(prefix="/routines", tags=["routines"])


@router.post("/", response_model=SavedRoutineResponse)
def create_routine(payload: SavedRoutineCreate, db: Session = Depends(get_db), current_user_id: int = 1):
    routine = SavedRoutine(
        user_id=current_user_id,
        name=payload.name,
        description=payload.description,
        routine_type=payload.routine_type,
        is_active=payload.is_active,
    )
    db.add(routine)
    db.flush()

    # Add products
    for p in payload.products:
        db.add(
            RoutineProduct(
                routine_id=routine.id,
                product_id=p.product_id,
                step_order=p.step_order,
                notes=p.notes,
            )
        )

    db.commit()
    db.refresh(routine)
    return routine


@router.get("/", response_model=list[SavedRoutineResponse])
def list_routines(db: Session = Depends(get_db), current_user_id: int = 1):
    items = db.query(SavedRoutine).filter(SavedRoutine.user_id == current_user_id).all()
    return items


@router.get("/{routine_id}", response_model=SavedRoutineResponse)
def get_routine(routine_id: UUID, db: Session = Depends(get_db), current_user_id: int = 1):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user_id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@router.put("/{routine_id}", response_model=SavedRoutineResponse)
def update_routine(routine_id: UUID, payload: SavedRoutineUpdate, db: Session = Depends(get_db), current_user_id: int = 1):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user_id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(routine, field, value)

    db.commit()
    db.refresh(routine)
    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(routine_id: UUID, db: Session = Depends(get_db), current_user_id: int = 1):
    routine = db.query(SavedRoutine).filter(
        SavedRoutine.id == routine_id,
        SavedRoutine.user_id == current_user_id
    ).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    db.delete(routine)
    db.commit()
    return None
