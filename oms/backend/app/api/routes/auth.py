from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import traceback

from ...core.database import get_db
from ...core.security import verify_password, create_access_token
from ...core.config import settings
from ...models.user import User
from ...schemas.auth import LoginRequest, LoginResponse, UserResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == request.email).first()
    except Exception as e:
        print(f"Database query error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    try:
        password_valid = verify_password(request.password, user.password)
    except Exception as e:
        print(f"Password verification error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password verification error: {str(e)}"
        )

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    try:
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role}
        )
    except Exception as e:
        print(f"Token creation error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token creation error: {str(e)}"
        )

    try:
        response = LoginResponse(
            user=UserResponse.model_validate(user),
            token=access_token
        )
        return response
    except Exception as e:
        print(f"Response creation error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Response creation error: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_db)
):
    from ..deps import get_current_user
    return UserResponse.model_validate(current_user)
