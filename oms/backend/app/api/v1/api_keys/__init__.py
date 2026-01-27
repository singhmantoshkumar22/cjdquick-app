"""
API Keys Management - Admin endpoints for managing client API keys
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.deps import get_current_user, require_admin
from app.models.api_key import (
    APIKey,
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    APIKeyCreatedResponse,
)

router = APIRouter(prefix="/api-keys", tags=["API Keys Management"])


@router.get("", response_model=List[APIKeyResponse])
def list_api_keys(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    company_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    List all API keys.
    SUPER_ADMIN can see all keys.
    ADMIN can only see keys for their company.
    """
    query = select(APIKey)

    # Filter by company for non-super-admins
    if current_user.role != "SUPER_ADMIN":
        query = query.where(APIKey.companyId == current_user.companyId)
    elif company_id:
        query = query.where(APIKey.companyId == company_id)

    if is_active is not None:
        query = query.where(APIKey.isActive == is_active)

    query = query.offset(skip).limit(limit).order_by(APIKey.createdAt.desc())

    keys = session.exec(query).all()
    return [APIKeyResponse.model_validate(k) for k in keys]


@router.get("/count")
def count_api_keys(
    company_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get total count of API keys."""
    query = select(func.count(APIKey.id))

    if current_user.role != "SUPER_ADMIN":
        query = query.where(APIKey.companyId == current_user.companyId)
    elif company_id:
        query = query.where(APIKey.companyId == company_id)

    if is_active is not None:
        query = query.where(APIKey.isActive == is_active)

    count = session.exec(query).one()
    return {"count": count}


@router.get("/{key_id}", response_model=APIKeyResponse)
def get_api_key(
    key_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get a specific API key by ID."""
    api_key = session.exec(
        select(APIKey).where(APIKey.id == key_id)
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check authorization
    if current_user.role != "SUPER_ADMIN" and api_key.companyId != current_user.companyId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this API key"
        )

    return APIKeyResponse.model_validate(api_key)


@router.post("", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_data: APIKeyCreate,
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """
    Create a new API key.

    **IMPORTANT:** The full API key is only shown once in the response.
    Store it securely - it cannot be retrieved later.

    Requires ADMIN or SUPER_ADMIN role.
    """
    # Generate the key
    full_key, prefix = APIKey.generate_key()

    # Create API key record
    api_key = APIKey(
        name=key_data.name,
        key=full_key,
        keyPrefix=prefix,
        channel=key_data.channel,
        permissions=key_data.permissions,
        rateLimit=key_data.rateLimit or 1000,
        companyId=key_data.companyId,
    )

    session.add(api_key)
    session.commit()
    session.refresh(api_key)

    # Return with full key (only time it's shown)
    response = APIKeyCreatedResponse.model_validate(api_key)
    response.key = full_key  # Include full key in response

    return response


@router.patch("/{key_id}", response_model=APIKeyResponse)
def update_api_key(
    key_id: UUID,
    key_data: APIKeyUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Update an API key.
    Note: The key itself cannot be changed - only metadata.
    """
    api_key = session.exec(
        select(APIKey).where(APIKey.id == key_id)
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check authorization
    if current_user.role != "SUPER_ADMIN" and api_key.companyId != current_user.companyId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this API key"
        )

    # Update fields
    update_dict = key_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(api_key, field, value)

    session.add(api_key)
    session.commit()
    session.refresh(api_key)

    return APIKeyResponse.model_validate(api_key)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    key_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Delete (deactivate) an API key.
    The key is not actually deleted but marked as inactive.
    """
    api_key = session.exec(
        select(APIKey).where(APIKey.id == key_id)
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check authorization
    if current_user.role != "SUPER_ADMIN" and api_key.companyId != current_user.companyId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this API key"
        )

    # Soft delete
    api_key.isActive = False
    session.add(api_key)
    session.commit()

    return None


@router.post("/{key_id}/regenerate", response_model=APIKeyCreatedResponse)
def regenerate_api_key(
    key_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """
    Regenerate an API key.
    This creates a new key value and invalidates the old one.

    **IMPORTANT:** The new key is only shown once in the response.
    """
    api_key = session.exec(
        select(APIKey).where(APIKey.id == key_id)
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check authorization
    if current_user.role != "SUPER_ADMIN" and api_key.companyId != current_user.companyId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to regenerate this API key"
        )

    # Generate new key
    full_key, prefix = APIKey.generate_key()
    api_key.key = full_key
    api_key.keyPrefix = prefix
    api_key.lastUsedAt = None  # Reset last used

    session.add(api_key)
    session.commit()
    session.refresh(api_key)

    # Return with full key
    response = APIKeyCreatedResponse.model_validate(api_key)
    response.key = full_key

    return response
