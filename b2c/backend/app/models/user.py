"""
User Model for B2C Courier
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String

from .base import BaseModel, ResponseBase, CreateBase
from .enums import UserRole


class User(BaseModel, table=True):
    """User model for B2C Courier"""
    __tablename__ = "B2CUser"

    email: str = Field(
        sa_column=Column(String, unique=True, nullable=False, index=True)
    )
    password: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    phone: Optional[str] = Field(default=None)

    role: UserRole = Field(
        default=UserRole.OPERATOR,
        sa_column=Column(String, default="OPERATOR")
    )
    isActive: bool = Field(default=True)
    lastLoginAt: Optional[datetime] = Field(default=None)


class UserCreate(CreateBase):
    """Schema for creating a new user"""
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.OPERATOR


class UserResponse(ResponseBase):
    """Schema for user API responses"""
    id: UUID
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    isActive: bool
    lastLoginAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class UserLogin(SQLModel):
    """Schema for login request"""
    email: str
    password: str
