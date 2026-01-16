"""
Base Model Configuration for SQLModel
Provides common fields, utilities, and base classes for all models
"""
from datetime import datetime, timezone
from typing import Optional, Any
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from pydantic import ConfigDict


def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


class TimestampMixin(SQLModel):
    """Mixin that adds created/updated timestamps"""
    createdAt: datetime = Field(
        default_factory=utc_now,
        sa_column_kwargs={"server_default": text("now()")}
    )
    updatedAt: datetime = Field(
        default_factory=utc_now,
        sa_column_kwargs={
            "server_default": text("now()"),
            "onupdate": utc_now
        }
    )


class UUIDMixin(SQLModel):
    """Mixin that adds UUID primary key with PostgreSQL native generation"""
    id: Optional[UUID] = Field(
        default=None,
        primary_key=True,
        sa_type=PG_UUID(as_uuid=True),
        sa_column_kwargs={"server_default": text("gen_random_uuid()")}
    )


class BaseModel(UUIDMixin, TimestampMixin, SQLModel):
    """
    Base model with UUID primary key and timestamps.
    Use this as the base for all database models.

    Example:
        class User(BaseModel, table=True):
            email: str
            name: str
    """
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class ActiveMixin(SQLModel):
    """Mixin that adds isActive field for soft delete"""
    isActive: bool = Field(default=True)


class CompanyMixin(SQLModel):
    """Mixin that adds companyId for multi-tenant models"""
    companyId: UUID = Field(
        foreign_key="Company.id",
        sa_type=PG_UUID(as_uuid=True),
        sa_column_kwargs={"nullable": False, "index": True}
    )


# Response/Schema base classes (not table=True)

class ResponseBase(SQLModel):
    """Base class for API response schemas"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class CreateBase(SQLModel):
    """Base class for create request schemas"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class UpdateBase(SQLModel):
    """Base class for update request schemas (all fields optional)"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
