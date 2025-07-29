"""
Pydantic schemas for user-related API operations
"""
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileBase(BaseModel):
    """Base user profile schema"""
    monthly_net_salary: Optional[str] = None
    annual_income: Optional[str] = None
    financial_goals: Optional[str] = None
    risk_tolerance: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"


class UserProfileCreate(UserProfileBase):
    """Schema for creating user profile"""
    user_id: str


class UserProfileUpdate(UserProfileBase):
    """Schema for updating user profile"""
    notification_preferences: Optional[str] = None
    setup_completed: Optional[bool] = None
    setup_step: Optional[int] = None


class UserProfileResponse(UserProfileBase):
    """Schema for user profile response"""
    id: int
    user_id: str
    setup_completed: bool
    setup_step: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserSessionResponse(BaseModel):
    """User session response schema"""
    id: str
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    expires_at: datetime
    created_at: datetime
    last_accessed: datetime
    
    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    """User settings update schema"""
    currency: Optional[str] = None
    timezone: Optional[str] = None
    notification_preferences: Optional[dict] = None
    language: Optional[str] = None


class UserStatsResponse(BaseModel):
    """User statistics response schema"""
    total_expenses: int
    total_spent: float
    total_bank_accounts: int
    total_transactions: int
    current_month_expenses: float
    last_month_expenses: float
    expense_growth: float