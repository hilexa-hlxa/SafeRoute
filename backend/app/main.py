from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import socketio
from app.routers import auth, incidents, users, sos, admin, routes
from app.socket_manager import sio

fastapi_app = FastAPI(
    title="SafeRoute API",
    version="1.0.0",
    swagger_ui_init_oauth={
        "clientId": "not-needed",
        "usePkceWithAuthorizationCodeGrant": False,
    }
)

# CORS configuration for Safari compatibility
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

fastapi_app.include_router(auth.router)
fastapi_app.include_router(incidents.router)
fastapi_app.include_router(users.router)
fastapi_app.include_router(sos.router)
fastapi_app.include_router(admin.router)
fastapi_app.include_router(routes.router)

@fastapi_app.get("/")
async def root():
    return {"message": "SafeRoute API"}

@fastapi_app.get("/health")
async def health():
    return {"status": "healthy"}

app = socketio.ASGIApp(sio, fastapi_app)

