"""
Authentication API for B2C Courier
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import verify_password, create_access_token
from app.models.user import User, UserLogin, UserResponse

router = APIRouter()


@router.post("/login")
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_session)
):
    """Authenticate user and return JWT token"""
    # Find user by email
    statement = select(User).where(User.email == credentials.email)
    user = db.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.isActive:
        raise HTTPException(status_code=401, detail="Account is deactivated")

    # Update last login
    user.lastLoginAt = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    # Create token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
    }
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "isActive": user.isActive,
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    db: Session = Depends(get_session)
):
    """Get current user info (placeholder - needs JWT middleware)"""
    raise HTTPException(status_code=401, detail="Not authenticated")
