"""
Locations API v1 - Location, Zone, and Bin management endpoints
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.deps import get_current_user, require_admin, require_manager, CompanyFilter
from app.models import (
    Location, LocationCreate, LocationUpdate, LocationResponse, LocationBrief,
    Zone, ZoneCreate, ZoneUpdate, ZoneResponse,
    Bin, BinCreate, BinUpdate, BinResponse,
    LocationType, ZoneType, User
)

router = APIRouter(prefix="/locations", tags=["Locations"])


# ============================================================================
# Location Endpoints
# ============================================================================

@router.get("", response_model=List[LocationBrief])
def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    type: Optional[LocationType] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    List locations.
    Filtered by company and user's location access.
    """
    query = select(Location)

    # Apply company filter
    if company_filter.company_id:
        query = query.where(Location.companyId == company_filter.company_id)

    # Filter by user's location access (unless super admin)
    if current_user.role != "SUPER_ADMIN" and current_user.locationAccess:
        query = query.where(Location.id.in_(current_user.locationAccess))

    # Apply filters
    if type:
        query = query.where(Location.type == type)
    if is_active is not None:
        query = query.where(Location.isActive == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Location.name.ilike(search_pattern)) |
            (Location.code.ilike(search_pattern))
        )

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Location.name)

    locations = session.exec(query).all()
    return [LocationBrief.model_validate(loc) for loc in locations]


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    location_id: UUID,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific location by ID."""
    query = select(Location).where(Location.id == location_id)

    if company_filter.company_id:
        query = query.where(Location.companyId == company_filter.company_id)

    location = session.exec(query).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    # Check location access
    if (current_user.role != "SUPER_ADMIN" and
        current_user.locationAccess and
        location_id not in current_user.locationAccess):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this location"
        )

    return LocationResponse.model_validate(location)


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location_data: LocationCreate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """Create a new location. Requires ADMIN or SUPER_ADMIN role."""
    # Non-super-admins can only create locations for their own company
    if company_filter.company_id:
        if location_data.companyId != company_filter.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create locations for other companies"
            )

    # Create location
    location = Location(**location_data.model_dump())
    session.add(location)
    session.commit()
    session.refresh(location)

    return LocationResponse.model_validate(location)


@router.patch("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: UUID,
    location_data: LocationUpdate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """Update a location. Requires ADMIN or SUPER_ADMIN role."""
    query = select(Location).where(Location.id == location_id)

    if company_filter.company_id:
        query = query.where(Location.companyId == company_filter.company_id)

    location = session.exec(query).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    # Update fields
    update_dict = location_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(location, field, value)

    session.add(location)
    session.commit()
    session.refresh(location)

    return LocationResponse.model_validate(location)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: UUID,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """Soft delete a location. Requires ADMIN or SUPER_ADMIN role."""
    query = select(Location).where(Location.id == location_id)

    if company_filter.company_id:
        query = query.where(Location.companyId == company_filter.company_id)

    location = session.exec(query).first()

    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    location.isActive = False
    session.add(location)
    session.commit()

    return None


# ============================================================================
# Zone Endpoints (nested under locations)
# ============================================================================

@router.get("/{location_id}/zones", response_model=List[ZoneResponse])
def list_zones(
    location_id: UUID,
    type: Optional[ZoneType] = None,
    is_active: Optional[bool] = None,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List zones for a location."""
    # Verify location access
    location_query = select(Location).where(Location.id == location_id)
    if company_filter.company_id:
        location_query = location_query.where(Location.companyId == company_filter.company_id)

    location = session.exec(location_query).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    # Build zones query
    query = select(Zone).where(Zone.locationId == location_id)

    if type:
        query = query.where(Zone.type == type)
    if is_active is not None:
        query = query.where(Zone.isActive == is_active)

    query = query.order_by(Zone.code)

    zones = session.exec(query).all()
    return [ZoneResponse.model_validate(z) for z in zones]


@router.post("/{location_id}/zones", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    location_id: UUID,
    zone_data: ZoneCreate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """Create a new zone in a location."""
    # Verify location exists and belongs to company
    location_query = select(Location).where(Location.id == location_id)
    if company_filter.company_id:
        location_query = location_query.where(Location.companyId == company_filter.company_id)

    location = session.exec(location_query).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    # Override locationId from URL
    zone_dict = zone_data.model_dump()
    zone_dict["locationId"] = location_id

    zone = Zone(**zone_dict)
    session.add(zone)
    session.commit()
    session.refresh(zone)

    return ZoneResponse.model_validate(zone)


@router.patch("/{location_id}/zones/{zone_id}", response_model=ZoneResponse)
def update_zone(
    location_id: UUID,
    zone_id: UUID,
    zone_data: ZoneUpdate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_admin())
):
    """Update a zone."""
    # Verify zone exists and belongs to location
    zone = session.exec(
        select(Zone).where(Zone.id == zone_id, Zone.locationId == location_id)
    ).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )

    # Update fields
    update_dict = zone_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(zone, field, value)

    session.add(zone)
    session.commit()
    session.refresh(zone)

    return ZoneResponse.model_validate(zone)


# ============================================================================
# Bin Endpoints (nested under zones)
# ============================================================================

@router.get("/{location_id}/zones/{zone_id}/bins", response_model=List[BinResponse])
def list_bins(
    location_id: UUID,
    zone_id: UUID,
    is_active: Optional[bool] = None,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List bins for a zone."""
    # Verify zone exists and belongs to location
    zone = session.exec(
        select(Zone).where(Zone.id == zone_id, Zone.locationId == location_id)
    ).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )

    # Build bins query
    query = select(Bin).where(Bin.zoneId == zone_id)

    if is_active is not None:
        query = query.where(Bin.isActive == is_active)

    query = query.order_by(Bin.code)

    bins = session.exec(query).all()
    return [BinResponse.model_validate(b) for b in bins]


@router.post("/{location_id}/zones/{zone_id}/bins", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(
    location_id: UUID,
    zone_id: UUID,
    bin_data: BinCreate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_manager())
):
    """Create a new bin in a zone."""
    # Verify zone exists and belongs to location
    zone = session.exec(
        select(Zone).where(Zone.id == zone_id, Zone.locationId == location_id)
    ).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )

    # Override zoneId from URL
    bin_dict = bin_data.model_dump()
    bin_dict["zoneId"] = zone_id

    bin_obj = Bin(**bin_dict)
    session.add(bin_obj)
    session.commit()
    session.refresh(bin_obj)

    return BinResponse.model_validate(bin_obj)


@router.patch("/{location_id}/zones/{zone_id}/bins/{bin_id}", response_model=BinResponse)
def update_bin(
    location_id: UUID,
    zone_id: UUID,
    bin_id: UUID,
    bin_data: BinUpdate,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    _: None = Depends(require_manager())
):
    """Update a bin."""
    # Verify bin exists and belongs to zone
    bin_obj = session.exec(
        select(Bin).where(Bin.id == bin_id, Bin.zoneId == zone_id)
    ).first()

    if not bin_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )

    # Update fields
    update_dict = bin_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(bin_obj, field, value)

    session.add(bin_obj)
    session.commit()
    session.refresh(bin_obj)

    return BinResponse.model_validate(bin_obj)
