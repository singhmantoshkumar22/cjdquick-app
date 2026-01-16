"""
Companies API v1 - Company management endpoints
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.deps import get_current_user, require_super_admin, CompanyFilter
from app.models import (
    Company, CompanyCreate, CompanyUpdate, CompanyResponse, CompanyBrief
)

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=List[CompanyBrief])
def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session)
):
    """
    List companies.
    SUPER_ADMIN can see all companies.
    Others can only see their own company.
    """
    query = select(Company)

    # Non-super-admins can only see their own company
    if company_filter.company_id:
        query = query.where(Company.id == company_filter.company_id)

    # Apply filters
    if is_active is not None:
        query = query.where(Company.isActive == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Company.name.ilike(search_pattern)) |
            (Company.code.ilike(search_pattern))
        )

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Company.name)

    companies = session.exec(query).all()
    return [CompanyBrief.model_validate(c) for c in companies]


@router.get("/count")
def count_companies(
    is_active: Optional[bool] = None,
    session: Session = Depends(get_session),
    _: None = Depends(require_super_admin())
):
    """Get total count of companies. Requires SUPER_ADMIN."""
    query = select(func.count(Company.id))

    if is_active is not None:
        query = query.where(Company.isActive == is_active)

    count = session.exec(query).one()
    return {"count": count}


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: UUID,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session)
):
    """Get a specific company by ID."""
    # Non-super-admins can only view their own company
    if company_filter.company_id and company_id != company_filter.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other companies"
        )

    company = session.exec(
        select(Company).where(Company.id == company_id)
    ).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    return CompanyResponse.model_validate(company)


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: CompanyCreate,
    session: Session = Depends(get_session),
    _: None = Depends(require_super_admin())
):
    """
    Create a new company.
    Requires SUPER_ADMIN role.
    """
    # Check if code already exists
    existing = session.exec(
        select(Company).where(Company.code == company_data.code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company code already exists"
        )

    # Create company
    company = Company(**company_data.model_dump())
    session.add(company)
    session.commit()
    session.refresh(company)

    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session)
):
    """
    Update a company.
    SUPER_ADMIN can update any company.
    ADMIN can update their own company (limited fields).
    """
    company = session.exec(
        select(Company).where(Company.id == company_id)
    ).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Non-super-admins can only update their own company
    if company_filter.company_id and company_id != company_filter.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other companies"
        )

    # Update fields
    update_dict = company_data.model_dump(exclude_unset=True)

    # Check code uniqueness if being updated
    if "code" in update_dict and update_dict["code"] != company.code:
        existing = session.exec(
            select(Company).where(Company.code == update_dict["code"])
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company code already exists"
            )

    for field, value in update_dict.items():
        setattr(company, field, value)

    session.add(company)
    session.commit()
    session.refresh(company)

    return CompanyResponse.model_validate(company)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: UUID,
    session: Session = Depends(get_session),
    _: None = Depends(require_super_admin())
):
    """
    Soft delete a company (set isActive=False).
    Requires SUPER_ADMIN role.
    """
    company = session.exec(
        select(Company).where(Company.id == company_id)
    ).first()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Soft delete
    company.isActive = False
    session.add(company)
    session.commit()

    return None
