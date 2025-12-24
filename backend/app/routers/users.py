from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdate
from app.core.auth_deps import get_current_user
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    
    if user_update.city is not None:
        current_user.city = user_update.city
    
    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

