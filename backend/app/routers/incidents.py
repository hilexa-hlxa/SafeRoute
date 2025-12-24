from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from math import radians, cos, sin, asin, sqrt
from datetime import datetime
from app.database import get_db
from app.models.user import User, UserRole
from app.models.incident import Incident, Vote
from app.schemas.incident import IncidentCreate, IncidentResponse, VoteCreate, VoteResponse
from app.core.auth_deps import get_current_user

router = APIRouter(prefix="/incidents", tags=["incidents"])


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth radius in meters
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_incident = Incident(
        user_id=current_user.id,
        type=incident_data.type,
        description=incident_data.description,
        lat=incident_data.lat,
        lng=incident_data.lng
    )
    
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)
    
    return IncidentResponse(
        id=new_incident.id,
        user_id=new_incident.user_id,
        type=new_incident.type,
        description=new_incident.description,
        lat=new_incident.lat,
        lng=new_incident.lng,
        status=new_incident.status,
        confirm_count=new_incident.confirm_count,
        reject_count=new_incident.reject_count,
        created_at=new_incident.created_at,
        resolved_at=new_incident.resolved_at
    )


@router.get("", response_model=List[IncidentResponse])
async def get_incidents(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(500, description="Radius in meters", ge=0),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Incident)
        .where(Incident.status.in_(["active", "pending"]))
        .order_by(Incident.created_at.desc())
    )
    
    all_incidents = result.scalars().all()
    
    nearby_incidents = []
    for incident in all_incidents:
        distance = haversine_distance(lat, lng, incident.lat, incident.lng)
        if distance <= radius:
            nearby_incidents.append(
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
            )
    
    return nearby_incidents


@router.post("/{incident_id}/vote", response_model=VoteResponse)
async def vote_incident(
    incident_id: str = Path(..., description="Incident ID"),
    vote_data: VoteCreate = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.status == "resolved":
        raise HTTPException(status_code=400, detail="Cannot vote on resolved incident")
    
    existing_vote = await db.execute(
        select(Vote).where(
            and_(Vote.incident_id == incident_id, Vote.user_id == current_user.id)
        )
    )
    vote = existing_vote.scalar_one_or_none()
    
    if vote:
        if vote.is_truthful == vote_data.is_truthful:
            raise HTTPException(status_code=400, detail="You already voted this way")
        
        old_value = vote.is_truthful
        vote.is_truthful = vote_data.is_truthful
        
        if old_value:
            incident.confirm_count -= 1
        else:
            incident.reject_count -= 1
        
        if vote_data.is_truthful:
            incident.confirm_count += 1
        else:
            incident.reject_count += 1
    else:
        new_vote = Vote(
            incident_id=incident_id,
            user_id=current_user.id,
            is_truthful=vote_data.is_truthful
        )
        db.add(new_vote)
        vote = new_vote
        
        if vote_data.is_truthful:
            incident.confirm_count += 1
        else:
            incident.reject_count += 1
    
    await db.commit()
    await db.refresh(vote)
    
    return VoteResponse(
        id=vote.id,
        incident_id=vote.incident_id,
        user_id=vote.user_id,
        is_truthful=vote.is_truthful,
        created_at=vote.created_at
    )


@router.patch("/{incident_id}/resolve")
async def resolve_incident(
    incident_id: str = Path(..., description="Incident ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.status == "resolved":
        raise HTTPException(status_code=400, detail="Incident already resolved")
    
    if incident.user_id != current_user.id and current_user.role != UserRole.admin.value:
        raise HTTPException(
            status_code=403,
            detail="Only the author or admin can resolve incidents"
        )
    
    incident.status = "resolved"
    incident.resolved_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Incident marked as resolved", "incident_id": incident_id}

