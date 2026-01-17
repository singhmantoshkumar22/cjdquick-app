"""
Dashboard API v1 - Dashboard statistics and analytics
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models import Order, OrderStatus, Inventory, SKU, Location, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(
    locationId: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics.
    Returns order counts, revenue, inventory stats, and order status breakdown.
    """
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Build base query with optional location filter
    base_filter = []
    if locationId:
        base_filter.append(Order.locationId == locationId)

    # Total orders
    total_query = select(func.count(Order.id))
    if base_filter:
        total_query = total_query.where(*base_filter)
    total_orders = session.exec(total_query).one() or 0

    # Today's orders
    today_query = select(func.count(Order.id)).where(
        Order.orderDate >= today_start,
        Order.orderDate <= today_end
    )
    if base_filter:
        today_query = today_query.where(*base_filter)
    today_orders = session.exec(today_query).one() or 0

    # Pending orders (CREATED, CONFIRMED, ALLOCATED)
    pending_statuses = [OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.ALLOCATED]
    pending_query = select(func.count(Order.id)).where(Order.status.in_(pending_statuses))
    if base_filter:
        pending_query = pending_query.where(*base_filter)
    pending_orders = session.exec(pending_query).one() or 0

    # Shipped orders
    shipped_query = select(func.count(Order.id)).where(Order.status == OrderStatus.SHIPPED)
    if base_filter:
        shipped_query = shipped_query.where(*base_filter)
    shipped_orders = session.exec(shipped_query).one() or 0

    # Delivered orders
    delivered_query = select(func.count(Order.id)).where(Order.status == OrderStatus.DELIVERED)
    if base_filter:
        delivered_query = delivered_query.where(*base_filter)
    delivered_orders = session.exec(delivered_query).one() or 0

    # Total revenue (from delivered orders)
    revenue_query = select(func.sum(Order.totalAmount)).where(Order.status == OrderStatus.DELIVERED)
    if base_filter:
        revenue_query = revenue_query.where(*base_filter)
    total_revenue = session.exec(revenue_query).one() or 0

    # Inventory stats
    inv_query = select(func.sum(Inventory.quantity))
    if locationId:
        inv_query = inv_query.where(Inventory.locationId == locationId)
    total_inventory = session.exec(inv_query).one() or 0

    # Total SKUs
    total_skus = session.exec(select(func.count(SKU.id))).one() or 0

    # Order status breakdown
    status_query = select(Order.status, func.count(Order.id)).group_by(Order.status)
    if base_filter:
        status_query = status_query.where(*base_filter)
    status_results = session.exec(status_query).all()
    order_by_status = {str(status.value) if hasattr(status, 'value') else str(status): count for status, count in status_results}

    return {
        "summary": {
            "totalOrders": total_orders,
            "todayOrders": today_orders,
            "pendingOrders": pending_orders,
            "shippedOrders": shipped_orders,
            "deliveredOrders": delivered_orders,
            "totalRevenue": float(total_revenue) if total_revenue else 0,
            "totalInventory": int(total_inventory) if total_inventory else 0,
            "totalSKUs": total_skus
        },
        "ordersByStatus": order_by_status,
        "recentActivity": []
    }


@router.get("/analytics")
def get_analytics(
    locationId: Optional[UUID] = None,
    period: str = Query("week", pattern="^(day|week|month|year)$"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard analytics - order trends over time.
    """
    today = datetime.now().date()

    if period == "day":
        start_date = today
    elif period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    else:
        start_date = today - timedelta(days=365)

    start_datetime = datetime.combine(start_date, datetime.min.time())

    # Daily order trend
    trend_query = select(
        func.date(Order.orderDate).label("date"),
        func.count(Order.id).label("count"),
        func.sum(Order.totalAmount).label("revenue")
    ).where(
        Order.orderDate >= start_datetime
    ).group_by(
        func.date(Order.orderDate)
    ).order_by(
        func.date(Order.orderDate)
    )

    if locationId:
        trend_query = trend_query.where(Order.locationId == locationId)

    results = session.exec(trend_query).all()

    return {
        "period": period,
        "orderTrend": [
            {
                "date": str(row.date),
                "orders": row.count,
                "revenue": float(row.revenue) if row.revenue else 0
            }
            for row in results
        ]
    }
