"""
Control Tower API v1 - Exception Detection Engine & Monitoring
This module provides intelligent monitoring and automatic exception detection
based on business rules applied to operational data.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select, func, and_, or_

from app.core.database import get_session
from app.core.deps import get_current_user, require_manager, CompanyFilter
from app.models.order import Order, Delivery
from app.models.ndr import NDR, AIActionLog
from app.models.returns import Return
from app.models.inventory import Inventory
from app.models.sku import SKU
from app.models.system import Exception as ExceptionModel
from app.models.user import User

router = APIRouter(prefix="/control-tower", tags=["Control Tower"])


# =============================================================================
# BUSINESS RULES CONFIGURATION
# =============================================================================

EXCEPTION_RULES = {
    "STUCK_ORDER": {
        "description": "Order stuck in initial status",
        "threshold_hours": 4,
        "severity_rules": {
            "CRITICAL": 24,  # > 24 hours = CRITICAL
            "HIGH": 12,      # > 12 hours = HIGH
            "MEDIUM": 4,     # > 4 hours = MEDIUM
        }
    },
    "SLA_BREACH": {
        "description": "Delivery past expected date",
        "severity_rules": {
            "CRITICAL": 3,   # > 3 days overdue = CRITICAL
            "HIGH": 1,       # > 1 day overdue = HIGH
            "MEDIUM": 0,     # Due today = MEDIUM
        }
    },
    "NDR_ESCALATION": {
        "description": "NDR unresolved too long",
        "threshold_hours": 48,
        "severity_rules": {
            "CRITICAL": 96,  # > 96 hours = CRITICAL
            "HIGH": 48,      # > 48 hours = HIGH
            "MEDIUM": 24,    # > 24 hours = MEDIUM
        }
    },
    "CARRIER_DELAY": {
        "description": "Shipment delayed in transit",
        "threshold_hours": 72,
        "severity_rules": {
            "CRITICAL": 120, # > 5 days = CRITICAL
            "HIGH": 72,      # > 3 days = HIGH
            "MEDIUM": 48,    # > 2 days = MEDIUM
        }
    },
    "INVENTORY_ISSUE": {
        "description": "Stock below reorder level",
        "severity_rules": {
            "CRITICAL": 0,   # Zero stock = CRITICAL
            "HIGH": 0.25,    # < 25% of reorder = HIGH
            "MEDIUM": 0.5,   # < 50% of reorder = MEDIUM
        }
    },
}


def calculate_severity(rule_type: str, value: float) -> str:
    """Calculate severity based on rule thresholds."""
    rules = EXCEPTION_RULES.get(rule_type, {}).get("severity_rules", {})
    for severity in ["CRITICAL", "HIGH", "MEDIUM"]:
        threshold = rules.get(severity, 0)
        if value >= threshold:
            return severity
    return "LOW"


def calculate_priority(severity: str) -> int:
    """Convert severity to numeric priority (1=highest)."""
    return {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}.get(severity, 5)


# =============================================================================
# EXCEPTION DETECTION ENGINE
# =============================================================================

@router.post("/detect-exceptions")
async def detect_exceptions(
    background_tasks: BackgroundTasks,
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_manager)
):
    """
    Trigger the exception detection engine.
    Scans all operational data and creates/updates exceptions based on business rules.
    """
    company_id = company_filter.company_id
    now = datetime.utcnow()

    exceptions_created = 0
    exceptions_updated = 0
    scan_results = {
        "stuck_orders": 0,
        "sla_breaches": 0,
        "ndr_escalations": 0,
        "carrier_delays": 0,
        "inventory_issues": 0,
    }

    # -------------------------------------------------------------------------
    # 1. DETECT STUCK ORDERS
    # -------------------------------------------------------------------------
    stuck_threshold = now - timedelta(hours=EXCEPTION_RULES["STUCK_ORDER"]["threshold_hours"])

    stuck_orders_query = select(Order).where(
        Order.status == "CREATED",
        Order.createdAt < stuck_threshold
    )
    if company_id:
        stuck_orders_query = stuck_orders_query.where(Order.companyId == company_id)

    stuck_orders = session.exec(stuck_orders_query).all()

    for order in stuck_orders:
        hours_stuck = (now - order.createdAt).total_seconds() / 3600
        severity = calculate_severity("STUCK_ORDER", hours_stuck)

        # Check if exception already exists
        existing = session.exec(
            select(ExceptionModel).where(
                ExceptionModel.entityType == "Order",
                ExceptionModel.entityId == order.orderNo,
                ExceptionModel.type == "STUCK_ORDER",
                ExceptionModel.status.in_(["OPEN", "IN_PROGRESS"])
            )
        ).first()

        if not existing:
            exception = ExceptionModel(
                id=uuid4(),
                exceptionCode=f"EXC-SO-{str(uuid4())[:8].upper()}",
                type="STUCK_ORDER",
                source="DETECTION_ENGINE",
                severity=severity,
                entityType="Order",
                entityId=order.orderNo,
                orderId=order.id,
                title=f"Order Stuck: {order.orderNo}",
                description=f"Order {order.orderNo} has been in CREATED status for {int(hours_stuck)} hours. "
                           f"Customer: {order.customerName or 'N/A'}. Amount: ₹{order.totalAmount or 0:,.2f}",
                autoResolvable=False,
                status="OPEN",
                priority=calculate_priority(severity),
                companyId=order.companyId,
                createdAt=now,
                updatedAt=now
            )
            session.add(exception)
            exceptions_created += 1
        else:
            # Update severity if it changed
            if existing.severity != severity:
                existing.severity = severity
                existing.priority = calculate_priority(severity)
                existing.updatedAt = now
                session.add(existing)
                exceptions_updated += 1

        scan_results["stuck_orders"] += 1

    # -------------------------------------------------------------------------
    # 2. DETECT SLA BREACHES (Deliveries past due)
    # -------------------------------------------------------------------------
    today = now.date()

    sla_breach_query = select(Delivery).where(
        Delivery.status.in_(["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"]),
        Delivery.expectedDeliveryDate < today
    )
    if company_id:
        sla_breach_query = sla_breach_query.where(Delivery.companyId == company_id)

    overdue_deliveries = session.exec(sla_breach_query).all()

    for delivery in overdue_deliveries:
        days_overdue = (today - delivery.expectedDeliveryDate).days if delivery.expectedDeliveryDate else 0
        severity = calculate_severity("SLA_BREACH", days_overdue)

        existing = session.exec(
            select(ExceptionModel).where(
                ExceptionModel.entityType == "Delivery",
                ExceptionModel.entityId == delivery.deliveryNo,
                ExceptionModel.type == "SLA_BREACH",
                ExceptionModel.status.in_(["OPEN", "IN_PROGRESS"])
            )
        ).first()

        if not existing:
            exception = ExceptionModel(
                id=uuid4(),
                exceptionCode=f"EXC-SLA-{str(uuid4())[:8].upper()}",
                type="SLA_BREACH",
                source="DETECTION_ENGINE",
                severity=severity,
                entityType="Delivery",
                entityId=delivery.deliveryNo,
                orderId=delivery.orderId,
                title=f"SLA Breach: {delivery.deliveryNo}",
                description=f"Delivery {delivery.deliveryNo} is {days_overdue} day(s) past expected delivery date. "
                           f"AWB: {delivery.awbNo or 'N/A'}. Status: {delivery.status}",
                autoResolvable=False,
                status="OPEN",
                priority=calculate_priority(severity),
                companyId=delivery.companyId,
                createdAt=now,
                updatedAt=now
            )
            session.add(exception)
            exceptions_created += 1
        else:
            if existing.severity != severity:
                existing.severity = severity
                existing.priority = calculate_priority(severity)
                existing.updatedAt = now
                session.add(existing)
                exceptions_updated += 1

        scan_results["sla_breaches"] += 1

    # -------------------------------------------------------------------------
    # 3. DETECT NDR ESCALATIONS
    # -------------------------------------------------------------------------
    ndr_threshold = now - timedelta(hours=EXCEPTION_RULES["NDR_ESCALATION"]["threshold_hours"])

    ndr_query = select(NDR).where(
        NDR.status == "OPEN",
        NDR.createdAt < ndr_threshold
    )
    if company_id:
        ndr_query = ndr_query.where(NDR.companyId == company_id)

    old_ndrs = session.exec(ndr_query).all()

    for ndr in old_ndrs:
        hours_open = (now - ndr.createdAt).total_seconds() / 3600
        severity = calculate_severity("NDR_ESCALATION", hours_open)

        existing = session.exec(
            select(ExceptionModel).where(
                ExceptionModel.entityType == "NDR",
                ExceptionModel.entityId == ndr.ndrCode,
                ExceptionModel.type == "NDR_ESCALATION",
                ExceptionModel.status.in_(["OPEN", "IN_PROGRESS"])
            )
        ).first()

        if not existing:
            exception = ExceptionModel(
                id=uuid4(),
                exceptionCode=f"EXC-NDR-{str(uuid4())[:8].upper()}",
                type="NDR_ESCALATION",
                source="DETECTION_ENGINE",
                severity=severity,
                entityType="NDR",
                entityId=ndr.ndrCode,
                orderId=ndr.orderId,
                title=f"NDR Escalation: {ndr.ndrCode}",
                description=f"NDR {ndr.ndrCode} has been open for {int(hours_open)} hours. "
                           f"Reason: {ndr.reason}. Attempt #{ndr.attemptNumber}",
                autoResolvable=True,
                status="OPEN",
                priority=calculate_priority(severity),
                companyId=ndr.companyId,
                createdAt=now,
                updatedAt=now
            )
            session.add(exception)
            exceptions_created += 1
        else:
            if existing.severity != severity:
                existing.severity = severity
                existing.priority = calculate_priority(severity)
                existing.updatedAt = now
                session.add(existing)
                exceptions_updated += 1

        scan_results["ndr_escalations"] += 1

    # -------------------------------------------------------------------------
    # 4. DETECT CARRIER DELAYS
    # -------------------------------------------------------------------------
    carrier_threshold = now - timedelta(hours=EXCEPTION_RULES["CARRIER_DELAY"]["threshold_hours"])

    carrier_delay_query = select(Delivery).where(
        Delivery.status.in_(["PICKED_UP", "IN_TRANSIT"]),
        Delivery.dispatchedAt < carrier_threshold
    )
    if company_id:
        carrier_delay_query = carrier_delay_query.where(Delivery.companyId == company_id)

    delayed_deliveries = session.exec(carrier_delay_query).all()

    for delivery in delayed_deliveries:
        if delivery.dispatchedAt:
            hours_in_transit = (now - delivery.dispatchedAt).total_seconds() / 3600
            severity = calculate_severity("CARRIER_DELAY", hours_in_transit)

            existing = session.exec(
                select(ExceptionModel).where(
                    ExceptionModel.entityType == "Delivery",
                    ExceptionModel.entityId == delivery.deliveryNo,
                    ExceptionModel.type == "CARRIER_DELAY",
                    ExceptionModel.status.in_(["OPEN", "IN_PROGRESS"])
                )
            ).first()

            if not existing:
                exception = ExceptionModel(
                    id=uuid4(),
                    exceptionCode=f"EXC-CD-{str(uuid4())[:8].upper()}",
                    type="CARRIER_DELAY",
                    source="DETECTION_ENGINE",
                    severity=severity,
                    entityType="Delivery",
                    entityId=delivery.deliveryNo,
                    orderId=delivery.orderId,
                    title=f"Carrier Delay: {delivery.deliveryNo}",
                    description=f"Delivery {delivery.deliveryNo} has been in transit for {int(hours_in_transit)} hours. "
                               f"AWB: {delivery.awbNo or 'N/A'}. Carrier: {delivery.transporterId or 'Unknown'}",
                    autoResolvable=False,
                    status="OPEN",
                    priority=calculate_priority(severity),
                    companyId=delivery.companyId,
                    createdAt=now,
                    updatedAt=now
                )
                session.add(exception)
                exceptions_created += 1

            scan_results["carrier_delays"] += 1

    # -------------------------------------------------------------------------
    # 5. AUTO-RESOLVE EXCEPTIONS (when underlying issue is fixed)
    # -------------------------------------------------------------------------
    # Find exceptions where the underlying entity status has changed
    open_exceptions = session.exec(
        select(ExceptionModel).where(
            ExceptionModel.status == "OPEN",
            ExceptionModel.companyId == company_id if company_id else True
        )
    ).all()

    auto_resolved = 0
    for exc in open_exceptions:
        should_resolve = False

        if exc.type == "STUCK_ORDER" and exc.orderId:
            order = session.get(Order, exc.orderId)
            if order and order.status != "CREATED":
                should_resolve = True

        elif exc.type == "SLA_BREACH" and exc.entityType == "Delivery":
            delivery = session.exec(
                select(Delivery).where(Delivery.deliveryNo == exc.entityId)
            ).first()
            if delivery and delivery.status == "DELIVERED":
                should_resolve = True

        elif exc.type == "NDR_ESCALATION":
            ndr = session.exec(
                select(NDR).where(NDR.ndrCode == exc.entityId)
            ).first()
            if ndr and ndr.status in ["RESOLVED", "RTO"]:
                should_resolve = True

        if should_resolve:
            exc.status = "RESOLVED"
            exc.resolution = "Auto-resolved: Underlying issue has been addressed"
            exc.resolvedAt = now
            exc.resolvedBy = "SYSTEM"
            exc.updatedAt = now
            session.add(exc)
            auto_resolved += 1

    # Commit all changes
    session.commit()

    return {
        "success": True,
        "timestamp": now.isoformat(),
        "summary": {
            "exceptions_created": exceptions_created,
            "exceptions_updated": exceptions_updated,
            "exceptions_auto_resolved": auto_resolved,
        },
        "scan_results": scan_results,
        "rules_applied": list(EXCEPTION_RULES.keys())
    }


@router.get("/dashboard")
def get_control_tower_dashboard(
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get Control Tower dashboard summary.
    Returns real-time counts and metrics from all monitoring systems.
    """
    company_id = company_filter.company_id
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Base query for exceptions
    exc_query = select(ExceptionModel)
    if company_id:
        exc_query = exc_query.where(ExceptionModel.companyId == company_id)

    all_exceptions = session.exec(exc_query).all()

    # Calculate counts
    critical_count = sum(1 for e in all_exceptions if e.severity == "CRITICAL" and e.status == "OPEN")
    open_count = sum(1 for e in all_exceptions if e.status == "OPEN")
    in_progress_count = sum(1 for e in all_exceptions if e.status == "IN_PROGRESS")
    resolved_today = sum(1 for e in all_exceptions if e.status == "RESOLVED" and e.resolvedAt and e.resolvedAt >= today_start)

    # Exception breakdown by type
    by_type = {}
    for e in all_exceptions:
        if e.status in ["OPEN", "IN_PROGRESS"]:
            by_type[e.type] = by_type.get(e.type, 0) + 1

    # Get order stats
    orders_query = select(func.count(Order.id)).where(Order.createdAt >= today_start)
    if company_id:
        orders_query = orders_query.where(Order.companyId == company_id)
    orders_today = session.exec(orders_query).one()

    # Get NDR stats
    ndr_query = select(func.count(NDR.id)).where(NDR.status == "OPEN")
    if company_id:
        ndr_query = ndr_query.where(NDR.companyId == company_id)
    open_ndrs = session.exec(ndr_query).one()

    return {
        "exceptions": {
            "critical": critical_count,
            "open": open_count,
            "inProgress": in_progress_count,
            "resolvedToday": resolved_today,
            "byType": by_type
        },
        "operations": {
            "ordersToday": orders_today,
            "openNDRs": open_ndrs,
        },
        "lastScan": now.isoformat(),
    }


@router.get("/health")
def get_system_health(
    company_filter: CompanyFilter = Depends(),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get overall system health score based on exception metrics.
    """
    company_id = company_filter.company_id

    exc_query = select(ExceptionModel).where(ExceptionModel.status.in_(["OPEN", "IN_PROGRESS"]))
    if company_id:
        exc_query = exc_query.where(ExceptionModel.companyId == company_id)

    active_exceptions = session.exec(exc_query).all()

    # Calculate health score (100 = perfect, decreases with exceptions)
    critical_penalty = sum(20 for e in active_exceptions if e.severity == "CRITICAL")
    high_penalty = sum(10 for e in active_exceptions if e.severity == "HIGH")
    medium_penalty = sum(5 for e in active_exceptions if e.severity == "MEDIUM")
    low_penalty = sum(2 for e in active_exceptions if e.severity == "LOW")

    total_penalty = critical_penalty + high_penalty + medium_penalty + low_penalty
    health_score = max(0, 100 - total_penalty)

    if health_score >= 90:
        status = "HEALTHY"
    elif health_score >= 70:
        status = "WARNING"
    elif health_score >= 50:
        status = "DEGRADED"
    else:
        status = "CRITICAL"

    return {
        "healthScore": health_score,
        "status": status,
        "activeExceptions": len(active_exceptions),
        "breakdown": {
            "critical": sum(1 for e in active_exceptions if e.severity == "CRITICAL"),
            "high": sum(1 for e in active_exceptions if e.severity == "HIGH"),
            "medium": sum(1 for e in active_exceptions if e.severity == "MEDIUM"),
            "low": sum(1 for e in active_exceptions if e.severity == "LOW"),
        }
    }
