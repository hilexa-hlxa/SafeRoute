from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="Password (max 72 bytes)")
    full_name: Optional[str] = Field(None, description="Full name (Name and Surname)")
    phone: Optional[str] = None
    city: Optional[str] = None
    role: UserRole = Field(UserRole.student, description="User role")
    admin_code: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            v = password_bytes[:72].decode('utf-8', errors='ignore')
        return v
    
    @model_validator(mode='after')
    def validate_admin_role(self):
        if self.role == UserRole.admin:
            if not self.admin_code or self.admin_code != "hilexahlxa":
                raise ValueError("Invalid admin code. Admin code 'hilexahlxa' required for admin role")
        return self


class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    is_active: bool
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    city: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    city: Optional[str] = None
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None

