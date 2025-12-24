from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.incident import SOSLog
from app.schemas.incident import SOSLogResponse, SOSSignal
from app.core.auth_deps import get_current_user
from app.socket_manager import sio

router = APIRouter(prefix="/sos", tags=["sos"])


@router.post("", status_code=201)
async def send_sos(
    sos_data: SOSSignal,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sos_log = SOSLog(
        user_id=current_user.id,
        lat=sos_data.lat,
        lng=sos_data.lng
    )
    
    db.add(sos_log)
    await db.commit()
    await db.refresh(sos_log)
    
    alert_payload = {
        'lat': sos_data.lat,
        'lng': sos_data.lng,
        'user_id': current_user.id,
        'timestamp': sos_log.timestamp.isoformat()
    }
    
    await sio.emit('emergency_alert', alert_payload, room='campus_broadcast')
    
    return {
        "message": "SOS signal sent",
        "id": sos_log.id,
        "lat": sos_log.lat,
        "lng": sos_log.lng,
        "timestamp": sos_log.timestamp
    }


@router.get("/history", response_model=List[SOSLogResponse])
async def get_sos_history(
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.admin.value:
        result = await db.execute(
            select(SOSLog)
            .order_by(SOSLog.timestamp.desc())
            .limit(limit)
        )
    else:
        result = await db.execute(
            select(SOSLog)
            .where(SOSLog.user_id == current_user.id)
            .order_by(SOSLog.timestamp.desc())
            .limit(limit)
        )
    
    logs = result.scalars().all()
    
    return [
        SOSLogResponse(
            id=log.id,
            user_id=log.user_id,
            lat=log.lat,
            lng=log.lng,
            timestamp=log.timestamp
        )
        for log in logs
    ]

