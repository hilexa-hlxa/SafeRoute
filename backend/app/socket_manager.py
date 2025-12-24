import socketio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.incident import SOSLog
from app.core.security import decode_access_token
from app.schemas.incident import SOSSignal

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)


async def get_user_from_token(token: str) -> User:
    payload = decode_access_token(token)
    if payload is None:
        raise ConnectionRefusedError("Invalid token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise ConnectionRefusedError("Invalid token")
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user is None or not user.is_active:
            raise ConnectionRefusedError("User not found or inactive")
        
        return user


@sio.event
async def connect(sid, environ, auth):
    try:
        token = None
        if auth and 'token' in auth:
            token_str = auth['token']
            if token_str.startswith('Bearer '):
                token = token_str.split('Bearer ')[1]
            else:
                token = token_str
        else:
            auth_header = environ.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1]
        
        if not token:
            raise ConnectionRefusedError("Missing or invalid authorization token")
        
        user = await get_user_from_token(token)
        
        await sio.save_session(sid, {'user_id': str(user.id)})
        await sio.enter_room(sid, 'campus_broadcast')
        
        print(f"User {user.email} connected with sid {sid}")
    except Exception as e:
        print(f"Connection error: {e}")
        raise ConnectionRefusedError("Authentication failed")


@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")


@sio.event
async def sos_signal(sid, data):
    try:
        session_data = await sio.get_session(sid)
        user_id = session_data.get('user_id')
        
        if not user_id:
            await sio.emit('error', {'message': 'Not authenticated'}, room=sid)
            return
        
        signal = SOSSignal(**data)
        
        async with AsyncSessionLocal() as db:
            sos_log = SOSLog(
                user_id=user_id,
                lat=signal.lat,
                lng=signal.lng
            )
            db.add(sos_log)
            await db.commit()
        
        alert_payload = {
            'lat': signal.lat,
            'lng': signal.lng,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        await sio.emit('emergency_alert', alert_payload, room='campus_broadcast')
        print(f"SOS signal broadcasted from user {user_id}")
        
    except Exception as e:
        print(f"Error handling SOS signal: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

