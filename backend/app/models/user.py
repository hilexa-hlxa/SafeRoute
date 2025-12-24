import uuid
from sqlalchemy import Column, String, Boolean
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.student.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    city = Column(String, nullable=True)

