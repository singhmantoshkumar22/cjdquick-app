"""
QC Models - SQLModel Implementation
Quality Control templates, executions, and results
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, NUMERIC

from .base import BaseModel, ResponseBase, CreateBase, UpdateBase
from .enums import QCType, QCStatus, QCParameterType, SeverityLevel

if TYPE_CHECKING:
    from .company import Company, Location, Bin
    from .sku import SKU


# ============================================================================
# Database Models
# ============================================================================

class QCTemplate(BaseModel, table=True):
    """
    QCTemplate model - Quality control template definition.
    Defines QC parameters and criteria for different QC types.
    """
    __tablename__ = "QCTemplate"

    # Identity
    code: str = Field(sa_column=Column(String, unique=True, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    description: Optional[str] = Field(default=None)

    # Type
    type: QCType = Field(sa_column=Column(String, nullable=False, index=True))

    # Foreign Key
    companyId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Company.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )

    # Filters
    categoryFilter: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )
    skuFilter: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # Flags
    isActive: bool = Field(default=True, sa_column=Column(Boolean, default=True))
    isMandatory: bool = Field(default=False, sa_column=Column(Boolean, default=False))

    # Relationships
    company: Optional["Company"] = Relationship()
    parameters: List["QCParameter"] = Relationship(back_populates="template")
    executions: List["QCExecution"] = Relationship(back_populates="template")


class QCParameter(BaseModel, table=True):
    """
    QCParameter model - Individual QC check parameter.
    Defines what to check and acceptable criteria.
    """
    __tablename__ = "QCParameter"
    __table_args__ = (
        UniqueConstraint("templateId", "code", name="qc_parameter_template_code_unique"),
    )

    # Foreign Key
    templateId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("QCTemplate.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )

    # Identity
    code: str = Field(sa_column=Column(String, nullable=False))
    name: str = Field(sa_column=Column(String, nullable=False))
    description: Optional[str] = Field(default=None)

    # Type
    type: QCParameterType = Field(sa_column=Column(String, nullable=False))

    # Validation criteria
    isMandatory: bool = Field(default=True, sa_column=Column(Boolean, default=True))
    acceptableValues: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )
    minValue: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )
    maxValue: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )
    tolerance: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(5, 2))
    )

    # Photo requirements
    requiresPhoto: bool = Field(default=False, sa_column=Column(Boolean, default=False))
    photoCount: int = Field(default=1)

    # Ordering
    sequence: int = Field(default=0)
    isActive: bool = Field(default=True, sa_column=Column(Boolean, default=True))

    # Relationships
    template: Optional["QCTemplate"] = Relationship(back_populates="parameters")
    results: List["QCResult"] = Relationship(back_populates="parameter")


class QCExecution(BaseModel, table=True):
    """
    QCExecution model - Actual QC inspection record.
    Tracks QC performed on items during inbound/return.
    """
    __tablename__ = "QCExecution"

    # Identity
    executionNo: str = Field(sa_column=Column(String, unique=True, nullable=False))

    # Foreign Keys
    templateId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("QCTemplate.id"),
            nullable=False,
            index=True
        )
    )
    skuId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("SKU.id"),
            nullable=False,
            index=True
        )
    )
    locationId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("Location.id"),
            nullable=False
        )
    )
    binId: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("Bin.id"))
    )

    # Reference (inbound, return, etc.)
    referenceType: str = Field(sa_column=Column(String, nullable=False))
    referenceId: UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), nullable=False))

    # Batch
    batchNo: Optional[str] = Field(default=None)

    # Quantities
    sampleQty: int = Field(default=0)
    passedQty: int = Field(default=0)
    failedQty: int = Field(default=0)

    # Status
    status: QCStatus = Field(
        default=QCStatus.PENDING,
        sa_column=Column(String, default="PENDING", index=True)
    )
    overallGrade: Optional[str] = Field(default=None)

    # Approval
    requiresApproval: bool = Field(default=False, sa_column=Column(Boolean, default=False))
    approvalStatus: Optional[str] = Field(default=None)
    approvedById: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True))
    )
    approvedAt: Optional[datetime] = Field(default=None)
    approvalRemarks: Optional[str] = Field(default=None)

    # Photos
    photos: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # Performer
    performedById: UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), nullable=False)
    )
    performedAt: datetime = Field(
        default_factory=lambda: datetime.utcnow(),
        sa_column=Column(nullable=False)
    )
    completedAt: Optional[datetime] = Field(default=None)

    # Remarks
    remarks: Optional[str] = Field(default=None)

    # Relationships
    template: Optional["QCTemplate"] = Relationship(back_populates="executions")
    sku: Optional["SKU"] = Relationship()
    results: List["QCResult"] = Relationship(back_populates="execution")
    defects: List["QCDefect"] = Relationship(back_populates="execution")


class QCResult(BaseModel, table=True):
    """
    QCResult model - Individual parameter result in QC execution.
    Records the actual value and pass/fail status.
    """
    __tablename__ = "QCResult"

    # Foreign Keys
    executionId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("QCExecution.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    parameterId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("QCParameter.id"),
            nullable=False,
            index=True
        )
    )

    # Values
    value: Optional[str] = Field(default=None)
    numericValue: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(NUMERIC(10, 2))
    )

    # Result
    isPassed: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))

    # Photos
    photos: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # Remarks
    remarks: Optional[str] = Field(default=None)

    # Relationships
    execution: Optional["QCExecution"] = Relationship(back_populates="results")
    parameter: Optional["QCParameter"] = Relationship(back_populates="results")


class QCDefect(BaseModel, table=True):
    """
    QCDefect model - Defect found during QC execution.
    Records defect details and corrective actions.
    """
    __tablename__ = "QCDefect"

    # Foreign Key
    executionId: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("QCExecution.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )

    # Defect info
    defectCode: str = Field(sa_column=Column(String, nullable=False))
    defectName: str = Field(sa_column=Column(String, nullable=False))
    severity: str = Field(sa_column=Column(String, nullable=False))
    quantity: int = Field(default=0)
    description: Optional[str] = Field(default=None)

    # Photos
    photos: List[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(String), default=[])
    )

    # Action
    action: Optional[str] = Field(default=None)
    actionById: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True))
    )
    actionAt: Optional[datetime] = Field(default=None)
    actionRemarks: Optional[str] = Field(default=None)

    # Relationships
    execution: Optional["QCExecution"] = Relationship(back_populates="defects")


# ============================================================================
# Request/Response Schemas
# ============================================================================

# --- QCTemplate Schemas ---

class QCTemplateCreate(CreateBase):
    """Schema for creating QC template"""
    code: str
    name: str
    description: Optional[str] = None
    type: QCType
    companyId: UUID
    categoryFilter: List[str] = []
    skuFilter: List[str] = []
    isMandatory: bool = False


class QCTemplateUpdate(UpdateBase):
    """Schema for updating QC template"""
    name: Optional[str] = None
    description: Optional[str] = None
    categoryFilter: Optional[List[str]] = None
    skuFilter: Optional[List[str]] = None
    isActive: Optional[bool] = None
    isMandatory: Optional[bool] = None


class QCTemplateResponse(ResponseBase):
    """Schema for QC template API responses"""
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    type: QCType
    companyId: UUID
    categoryFilter: List[str] = []
    skuFilter: List[str] = []
    isActive: bool
    isMandatory: bool
    createdAt: datetime
    updatedAt: datetime


# --- QCParameter Schemas ---

class QCParameterCreate(CreateBase):
    """Schema for creating QC parameter"""
    templateId: UUID
    code: str
    name: str
    description: Optional[str] = None
    type: QCParameterType
    isMandatory: bool = True
    acceptableValues: List[str] = []
    minValue: Optional[Decimal] = None
    maxValue: Optional[Decimal] = None
    tolerance: Optional[Decimal] = None
    requiresPhoto: bool = False
    photoCount: int = 1
    sequence: int = 0


class QCParameterUpdate(UpdateBase):
    """Schema for updating QC parameter"""
    name: Optional[str] = None
    description: Optional[str] = None
    isMandatory: Optional[bool] = None
    acceptableValues: Optional[List[str]] = None
    minValue: Optional[Decimal] = None
    maxValue: Optional[Decimal] = None
    tolerance: Optional[Decimal] = None
    requiresPhoto: Optional[bool] = None
    photoCount: Optional[int] = None
    sequence: Optional[int] = None
    isActive: Optional[bool] = None


class QCParameterResponse(ResponseBase):
    """Schema for QC parameter API responses"""
    id: UUID
    templateId: UUID
    code: str
    name: str
    description: Optional[str] = None
    type: QCParameterType
    isMandatory: bool
    acceptableValues: List[str] = []
    minValue: Optional[Decimal] = None
    maxValue: Optional[Decimal] = None
    tolerance: Optional[Decimal] = None
    requiresPhoto: bool
    photoCount: int
    sequence: int
    isActive: bool
    createdAt: datetime
    updatedAt: datetime


# --- QCExecution Schemas ---

class QCExecutionCreate(CreateBase):
    """Schema for creating QC execution"""
    executionNo: str
    templateId: UUID
    skuId: UUID
    locationId: UUID
    referenceType: str
    referenceId: UUID
    performedById: UUID
    binId: Optional[UUID] = None
    batchNo: Optional[str] = None
    sampleQty: int = 0


class QCExecutionUpdate(UpdateBase):
    """Schema for updating QC execution"""
    status: Optional[QCStatus] = None
    passedQty: Optional[int] = None
    failedQty: Optional[int] = None
    overallGrade: Optional[str] = None
    approvalStatus: Optional[str] = None
    approvedById: Optional[UUID] = None
    approvedAt: Optional[datetime] = None
    approvalRemarks: Optional[str] = None
    photos: Optional[List[str]] = None
    completedAt: Optional[datetime] = None
    remarks: Optional[str] = None


class QCExecutionResponse(ResponseBase):
    """Schema for QC execution API responses"""
    id: UUID
    executionNo: str
    templateId: UUID
    skuId: UUID
    locationId: UUID
    binId: Optional[UUID] = None
    referenceType: str
    referenceId: UUID
    batchNo: Optional[str] = None
    sampleQty: int
    passedQty: int
    failedQty: int
    status: QCStatus
    overallGrade: Optional[str] = None
    requiresApproval: bool
    approvalStatus: Optional[str] = None
    approvedById: Optional[UUID] = None
    approvedAt: Optional[datetime] = None
    approvalRemarks: Optional[str] = None
    photos: List[str] = []
    performedById: UUID
    performedAt: datetime
    completedAt: Optional[datetime] = None
    remarks: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


# --- QCResult Schemas ---

class QCResultCreate(CreateBase):
    """Schema for creating QC result"""
    executionId: UUID
    parameterId: UUID
    value: Optional[str] = None
    numericValue: Optional[Decimal] = None
    isPassed: bool
    photos: List[str] = []
    remarks: Optional[str] = None


class QCResultUpdate(UpdateBase):
    """Schema for updating QC result"""
    value: Optional[str] = None
    numericValue: Optional[Decimal] = None
    isPassed: Optional[bool] = None
    photos: Optional[List[str]] = None
    remarks: Optional[str] = None


class QCResultResponse(ResponseBase):
    """Schema for QC result API responses"""
    id: UUID
    executionId: UUID
    parameterId: UUID
    value: Optional[str] = None
    numericValue: Optional[Decimal] = None
    isPassed: bool
    photos: List[str] = []
    remarks: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


# --- QCDefect Schemas ---

class QCDefectCreate(CreateBase):
    """Schema for creating QC defect"""
    executionId: UUID
    defectCode: str
    defectName: str
    severity: str
    quantity: int
    description: Optional[str] = None
    photos: List[str] = []


class QCDefectUpdate(UpdateBase):
    """Schema for updating QC defect"""
    quantity: Optional[int] = None
    description: Optional[str] = None
    photos: Optional[List[str]] = None
    action: Optional[str] = None
    actionById: Optional[UUID] = None
    actionAt: Optional[datetime] = None
    actionRemarks: Optional[str] = None


class QCDefectResponse(ResponseBase):
    """Schema for QC defect API responses"""
    id: UUID
    executionId: UUID
    defectCode: str
    defectName: str
    severity: str
    quantity: int
    description: Optional[str] = None
    photos: List[str] = []
    action: Optional[str] = None
    actionById: Optional[UUID] = None
    actionAt: Optional[datetime] = None
    actionRemarks: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


# --- Summary Schemas ---

class QCSummary(SQLModel):
    """QC summary statistics"""
    totalExecutions: int
    passedExecutions: int
    failedExecutions: int
    pendingExecutions: int
    passRate: float
    avgDefectsPerExecution: float
    byTemplate: dict
