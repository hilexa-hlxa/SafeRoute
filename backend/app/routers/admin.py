from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime
from app.database import get_db
from app.models.user import User, UserRole
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from app.schemas.auth import UserResponse
from app.core.auth_deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/incidents", response_model=List[IncidentResponse])
async def get_all_incidents(
    status: str = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident)
    
    if status:
        query = query.where(Incident.status == status)
    
    query = query.order_by(Incident.created_at.desc())
    
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    return [
        IncidentResponse(
            id=incident.id,
            user_id=incident.user_id,
            type=incident.type,
            description=incident.description,
            lat=incident.lat,
            lng=incident.lng,
            status=incident.status,
            confirm_count=incident.confirm_count,
            reject_count=incident.reject_count,
            created_at=incident.created_at,
            resolved_at=incident.resolved_at
        )
        for incident in incidents
    ]


@router.patch("/incidents/{incident_id}/approve")
async def approve_incident(
    incident_id: str = Path(..., description="Incident ID"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.status == "resolved":
        raise HTTPException(status_code=400, detail="Cannot approve resolved incident")
    
    incident.status = "active"
    
    await db.commit()
    
    return {
        "message": "Incident approved",
        "incident_id": incident_id,
        "status": "active"
    }


@router.patch("/incidents/{incident_id}/reject")
async def reject_incident(
    incident_id: str = Path(..., description="Incident ID"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.status == "resolved":
        raise HTTPException(status_code=400, detail="Cannot reject resolved incident")
    
    incident.status = "rejected"
    
    await db.commit()
    
    return {
        "message": "Incident rejected",
        "incident_id": incident_id,
        "status": "rejected"
    }


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.email))
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            full_name=user.full_name,
            phone=user.phone,
            avatar=user.avatar,
            city=user.city
        )
        for user in users
    ]


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str = Path(..., description="User ID"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.admin.value:
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    from app.models.incident import Incident, Vote, SOSLog
    
    await db.execute(delete(Vote).where(Vote.user_id == user_id))
    await db.execute(delete(SOSLog).where(SOSLog.user_id == user_id))
    await db.execute(delete(Incident).where(Incident.user_id == user_id))
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    
    return {"message": "User deleted", "user_id": user_id}

