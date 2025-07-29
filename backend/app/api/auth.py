"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserProfile, UserSession
from app.schemas.user import (
    UserCreate, 
    UserResponse, 
    TokenResponse, 
    LoginRequest,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest
)
from app.services.auth_service import AuthService
from app.services.email_service import EmailService

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    auth_service = AuthService(db)
    
    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = await auth_service.create_user(user_data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token"""
    auth_service = AuthService(db)
    
    # Authenticate user
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    # Create session
    device_info = {
        "user_agent": request.headers.get("user-agent"),
        "ip_address": request.client.host if request.client else None
    }
    
    session = await auth_service.create_session(user.id, device_info)
    
    # Generate tokens
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "session_id": session.id}
    )
    refresh_token = auth_service.create_refresh_token(
        data={"sub": user.id, "session_id": session.id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)
    
    try:
        # Decode refresh token
        payload = jwt.decode(
            token_data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        
        if user_id is None or session_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Validate session
    session = await auth_service.get_session(session_id)
    if not session or not session.is_active or session.is_expired():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
    
    # Generate new tokens
    access_token = auth_service.create_access_token(
        data={"sub": user_id, "session_id": session_id}
    )
    new_refresh_token = auth_service.create_refresh_token(
        data={"sub": user_id, "session_id": session_id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Logout user and invalidate session"""
    auth_service = AuthService(db)
    
    try:
        # Decode token to get session ID
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        session_id: str = payload.get("session_id")
        
        if session_id:
            await auth_service.invalidate_session(session_id)
            
    except jwt.JWTError:
        pass  # Token is invalid anyway
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(AuthService.get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.post("/forgot-password")
async def forgot_password(
    request_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send password reset email"""
    auth_service = AuthService(db)
    email_service = EmailService()
    
    user = await auth_service.get_user_by_email(request_data.email)
    if not user:
        # Don't reveal whether user exists or not
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = auth_service.create_password_reset_token(user.id)
    
    # Send email
    try:
        await email_service.send_password_reset_email(user.email, reset_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email"
        )
    
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Reset user password with token"""
    auth_service = AuthService(db)
    
    try:
        # Decode reset token
        payload = jwt.decode(
            reset_data.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
            
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Update password
    await auth_service.update_password(user.id, reset_data.new_password)
    
    # Invalidate all user sessions
    await auth_service.invalidate_all_user_sessions(user.id)
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)
    
    # Verify current password
    if not auth_service.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    await auth_service.update_password(current_user.id, password_data.new_password)
    
    return {"message": "Password changed successfully"}


@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's active sessions"""
    auth_service = AuthService(db)
    sessions = await auth_service.get_user_sessions(current_user.id)
    return sessions


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a specific session"""
    auth_service = AuthService(db)
    
    session = await auth_service.get_session(session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    await auth_service.invalidate_session(session_id)
    return {"message": "Session revoked successfully"}