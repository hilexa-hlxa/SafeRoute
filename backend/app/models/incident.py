import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, Integer, Boolean, func, Index, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class IncidentType(str, enum.Enum):
    no_light = "no_light"
    aggressive_animal = "aggressive_animal"
    harassment = "harassment"
    ice = "ice"
    other = "other"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False)
    confirm_count = Column(Integer, default=0, nullable=False)
    reject_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="incidents")
    votes = relationship("Vote", back_populates="incident", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_incident_location', 'lat', 'lng'),
        Index('idx_incident_status', 'status'),
    )


class Vote(Base):
    __tablename__ = "votes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    is_truthful = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    incident = relationship("Incident", back_populates="votes")
    user = relationship("User", backref="votes")

    __table_args__ = (
        UniqueConstraint('incident_id', 'user_id', name='uq_vote_incident_user'),
    )


class SOSLog(Base):
    __tablename__ = "sos_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", backref="sos_logs")

