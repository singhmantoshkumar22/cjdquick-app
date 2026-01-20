"""
Putaway Service - Bin suggestion and task management
"""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID, uuid4

from sqlmodel import Session, select, func

from app.models import (
    PutawayTask, PutawayTaskCreate, PutawayTaskResponse,
    BinSuggestion, BinSuggestionRequest, BinSuggestionResponse,
    GoodsReceipt, GoodsReceiptItem,
    SKU, Bin, Zone, Inventory, Location,
)


class PutawayService:
    """Service for putaway operations and bin suggestions."""

    def __init__(self, session: Session):
        self.session = session

    def generate_task_no(self, company_id: UUID) -> str:
        """Generate unique task number."""
        # Get max task number for today
        today = datetime.utcnow().strftime("%Y%m%d")
        prefix = f"PUT-{today}-"

        # Find existing tasks with this prefix
        max_num = self.session.exec(
            select(func.max(PutawayTask.taskNo))
            .where(PutawayTask.taskNo.like(f"{prefix}%"))
            .where(PutawayTask.companyId == company_id)
        ).first()

        if max_num:
            try:
                num = int(max_num.split("-")[-1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1

        return f"{prefix}{num:04d}"

    def suggest_bin(
        self,
        request: BinSuggestionRequest,
        company_id: UUID
    ) -> BinSuggestionResponse:
        """
        Suggest optimal bins for putaway based on multiple factors:
        1. SKU storage requirements (temperature, zone type)
        2. Existing inventory of same SKU (consolidation)
        3. Available capacity (weight, volume, units)
        4. Zone priority
        5. Pick sequence optimization
        """
        suggestions: List[BinSuggestion] = []

        # Get SKU details
        sku = self.session.exec(
            select(SKU).where(SKU.id == request.skuId)
        ).first()

        if not sku:
            return BinSuggestionResponse(suggestions=[], defaultBinId=None, defaultBinCode=None)

        # Get location
        location = self.session.exec(
            select(Location).where(Location.id == request.locationId)
        ).first()

        if not location:
            return BinSuggestionResponse(suggestions=[], defaultBinId=None, defaultBinCode=None)

        # Find all active bins at this location
        bins_query = (
            select(Bin)
            .join(Zone, Zone.id == Bin.zoneId)
            .where(Bin.isActive == True)
            .where(Zone.locationId == request.locationId)
            .where(Zone.isActive == True)
        )

        # Filter by zone type if SKU has specific requirements
        # For now, get all bins and score them
        bins = self.session.exec(bins_query).all()

        for bin_obj in bins:
            # Get zone info
            zone = self.session.exec(
                select(Zone).where(Zone.id == bin_obj.zoneId)
            ).first()

            if not zone:
                continue

            # Calculate score and check eligibility
            score, reason, eligible = self._score_bin(
                bin_obj, zone, sku, request.quantity, request.preferSameSkuBins, request.preferEmptyBins
            )

            if eligible:
                # Check if bin has same SKU
                existing_inventory = self.session.exec(
                    select(Inventory)
                    .where(Inventory.binId == bin_obj.id)
                    .where(Inventory.skuId == request.skuId)
                ).first()

                # Check if bin is empty
                any_inventory = self.session.exec(
                    select(Inventory)
                    .where(Inventory.binId == bin_obj.id)
                    .where(Inventory.quantity > 0)
                ).first()

                # Calculate available capacity
                available_capacity = self._get_available_capacity(bin_obj, request.quantity)

                suggestions.append(BinSuggestion(
                    binId=bin_obj.id,
                    binCode=bin_obj.code,
                    zoneName=zone.name,
                    zoneType=zone.type,
                    score=score,
                    reason=reason,
                    availableCapacity=available_capacity,
                    hasSameSku=existing_inventory is not None,
                    isEmpty=any_inventory is None
                ))

        # Sort by score (highest first)
        suggestions.sort(key=lambda x: x.score, reverse=True)

        # Limit to top 10 suggestions
        suggestions = suggestions[:10]

        # Set default bin (highest scored)
        default_bin_id = suggestions[0].binId if suggestions else None
        default_bin_code = suggestions[0].binCode if suggestions else None

        return BinSuggestionResponse(
            suggestions=suggestions,
            defaultBinId=default_bin_id,
            defaultBinCode=default_bin_code
        )

    def _score_bin(
        self,
        bin_obj: Bin,
        zone: Zone,
        sku: SKU,
        quantity: int,
        prefer_same_sku: bool,
        prefer_empty: bool
    ) -> Tuple[float, str, bool]:
        """
        Score a bin for putaway suitability.
        Returns (score, reason, eligible).
        Higher score = better choice.
        """
        score = 50.0  # Base score
        reasons = []

        # Check capacity constraints
        if bin_obj.maxUnits and bin_obj.currentUnits is not None:
            available_units = bin_obj.maxUnits - bin_obj.currentUnits
            if available_units < quantity:
                return 0, "Insufficient unit capacity", False
            # Score based on capacity utilization (prefer partial bins for consolidation)
            utilization = bin_obj.currentUnits / bin_obj.maxUnits if bin_obj.maxUnits else 0
            if prefer_empty:
                score += (1 - utilization) * 20  # Prefer empty bins
                if utilization == 0:
                    reasons.append("Empty bin")
            else:
                # Prefer bins that are partially filled (60-80% is optimal)
                if 0.4 <= utilization <= 0.8:
                    score += 15
                    reasons.append("Optimal capacity")

        # Check if same SKU exists in bin
        existing_inventory = self.session.exec(
            select(Inventory)
            .where(Inventory.binId == bin_obj.id)
            .where(Inventory.skuId == sku.id)
            .where(Inventory.quantity > 0)
        ).first()

        if existing_inventory:
            if prefer_same_sku:
                score += 30  # High bonus for consolidation
                reasons.append("Same SKU consolidation")
        else:
            # Check if bin has any other SKU
            other_inventory = self.session.exec(
                select(Inventory)
                .where(Inventory.binId == bin_obj.id)
                .where(Inventory.quantity > 0)
            ).first()

            if other_inventory:
                # Bin has different SKU - lower score
                score -= 10
                reasons.append("Mixed SKU")
            else:
                score += 10  # Empty bin bonus
                reasons.append("Empty bin")

        # Zone type matching
        if zone.type:
            zone_type = zone.type.upper() if isinstance(zone.type, str) else zone.type.value
            if zone_type == "PICK":
                score += 10  # Prefer pick zones for faster access
                reasons.append("Pick zone")
            elif zone_type == "BULK":
                score += 5
                reasons.append("Bulk storage")
            elif zone_type == "RESERVE":
                score += 3
                reasons.append("Reserve storage")

        # Temperature matching (if applicable)
        if zone.temperatureType:
            # SKU should have matching storage requirements
            # For now, just add a small bonus for temperature-controlled zones
            score += 5
            reasons.append(f"{zone.temperatureType} storage")

        # Zone priority (lower priority number = higher score)
        if zone.priority:
            score += max(0, 10 - zone.priority)

        # Pick sequence optimization (prefer lower sequence for faster picking later)
        if bin_obj.pickSequence:
            score += max(0, 10 - (bin_obj.pickSequence / 100))

        # Staging/receiving bins get lower score (not for long-term storage)
        if bin_obj.isStaging:
            score -= 20
            reasons.append("Staging bin")

        reason = ", ".join(reasons) if reasons else "Standard storage"
        return score, reason, True

    def _get_available_capacity(self, bin_obj: Bin, requested_qty: int) -> int:
        """Calculate available capacity in bin."""
        if bin_obj.maxUnits:
            current = bin_obj.currentUnits or 0
            return max(0, bin_obj.maxUnits - current)
        return 99999  # Unlimited capacity

    def create_tasks_from_goods_receipt(
        self,
        goods_receipt_id: UUID,
        auto_suggest_bins: bool,
        created_by_id: Optional[UUID],
        company_id: UUID
    ) -> List[PutawayTask]:
        """
        Create putaway tasks for all items in a goods receipt.
        Called after GR is posted.
        """
        tasks: List[PutawayTask] = []

        # Get goods receipt
        gr = self.session.exec(
            select(GoodsReceipt)
            .where(GoodsReceipt.id == goods_receipt_id)
        ).first()

        if not gr:
            return tasks

        # Get all items
        items = self.session.exec(
            select(GoodsReceiptItem)
            .where(GoodsReceiptItem.goodsReceiptId == goods_receipt_id)
        ).all()

        for item in items:
            # Skip if no quantity to putaway
            if not item.acceptedQty or item.acceptedQty <= 0:
                continue

            # Determine target bin
            target_bin_id = item.targetBinId

            if not target_bin_id and auto_suggest_bins:
                # Auto-suggest bin
                suggestion_request = BinSuggestionRequest(
                    skuId=item.skuId,
                    quantity=item.acceptedQty,
                    locationId=gr.locationId,
                    preferSameSkuBins=True,
                    preferEmptyBins=False
                )
                suggestion_response = self.suggest_bin(suggestion_request, company_id)
                if suggestion_response.defaultBinId:
                    target_bin_id = suggestion_response.defaultBinId

            if not target_bin_id:
                # No bin found - skip or use default staging
                continue

            # Create putaway task
            task = PutawayTask(
                id=uuid4(),
                taskNo=self.generate_task_no(company_id),
                goodsReceiptId=goods_receipt_id,
                goodsReceiptItemId=item.id,
                skuId=item.skuId,
                quantity=item.acceptedQty,
                batchNo=item.batchNo,
                lotNo=item.lotNo,
                expiryDate=item.expiryDate,
                fromBinId=None,  # From staging/receiving area
                toBinId=target_bin_id,
                status="PENDING",
                priority=5,  # Default priority
                locationId=gr.locationId,
                companyId=company_id,
                createdById=created_by_id,
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )

            self.session.add(task)
            tasks.append(task)

        self.session.commit()

        # Refresh all tasks
        for task in tasks:
            self.session.refresh(task)

        return tasks

    def assign_task(
        self,
        task_id: UUID,
        assigned_to_id: UUID,
        assigned_by_id: UUID
    ) -> Optional[PutawayTask]:
        """Assign a putaway task to a user."""
        task = self.session.exec(
            select(PutawayTask).where(PutawayTask.id == task_id)
        ).first()

        if not task:
            return None

        if task.status not in ["PENDING", "ASSIGNED"]:
            return None

        task.assignedToId = assigned_to_id
        task.assignedById = assigned_by_id
        task.assignedAt = datetime.utcnow()
        task.status = "ASSIGNED"
        task.updatedAt = datetime.utcnow()

        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)

        return task

    def start_task(self, task_id: UUID, user_id: UUID) -> Optional[PutawayTask]:
        """Start working on a putaway task."""
        task = self.session.exec(
            select(PutawayTask).where(PutawayTask.id == task_id)
        ).first()

        if not task:
            return None

        if task.status not in ["PENDING", "ASSIGNED"]:
            return None

        task.status = "IN_PROGRESS"
        task.startedAt = datetime.utcnow()
        task.updatedAt = datetime.utcnow()

        # Auto-assign if not already assigned
        if not task.assignedToId:
            task.assignedToId = user_id
            task.assignedAt = datetime.utcnow()

        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)

        return task

    def complete_task(
        self,
        task_id: UUID,
        completed_by_id: UUID,
        actual_bin_id: Optional[UUID] = None,
        actual_qty: Optional[int] = None,
        notes: Optional[str] = None
    ) -> Optional[PutawayTask]:
        """
        Complete a putaway task.
        Updates inventory location if bin changed.
        """
        task = self.session.exec(
            select(PutawayTask).where(PutawayTask.id == task_id)
        ).first()

        if not task:
            return None

        if task.status not in ["PENDING", "ASSIGNED", "IN_PROGRESS"]:
            return None

        # Determine final bin and quantity
        final_bin_id = actual_bin_id or task.toBinId
        final_qty = actual_qty or task.quantity

        # Update inventory location
        # Find or create inventory record at target bin
        existing_inventory = self.session.exec(
            select(Inventory)
            .where(Inventory.skuId == task.skuId)
            .where(Inventory.binId == final_bin_id)
            .where(Inventory.batchNo == task.batchNo if task.batchNo else True)
        ).first()

        if existing_inventory:
            # Add to existing inventory
            existing_inventory.quantity += final_qty
            existing_inventory.updatedAt = datetime.utcnow()
            self.session.add(existing_inventory)
        else:
            # Create new inventory record
            new_inventory = Inventory(
                id=uuid4(),
                skuId=task.skuId,
                binId=final_bin_id,
                locationId=task.locationId,
                companyId=task.companyId,
                quantity=final_qty,
                reservedQty=0,
                batchNo=task.batchNo,
                lotNo=task.lotNo,
                expiryDate=task.expiryDate,
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            self.session.add(new_inventory)

        # Update bin capacity
        target_bin = self.session.exec(
            select(Bin).where(Bin.id == final_bin_id)
        ).first()

        if target_bin and target_bin.currentUnits is not None:
            target_bin.currentUnits = (target_bin.currentUnits or 0) + final_qty
            self.session.add(target_bin)

        # Update task
        task.status = "COMPLETED"
        task.completedAt = datetime.utcnow()
        task.completedById = completed_by_id
        task.actualBinId = actual_bin_id
        task.actualQty = actual_qty
        task.updatedAt = datetime.utcnow()

        if notes:
            task.notes = notes

        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)

        return task

    def cancel_task(
        self,
        task_id: UUID,
        cancelled_by_id: UUID,
        reason: str
    ) -> Optional[PutawayTask]:
        """Cancel a putaway task."""
        task = self.session.exec(
            select(PutawayTask).where(PutawayTask.id == task_id)
        ).first()

        if not task:
            return None

        if task.status in ["COMPLETED", "CANCELLED"]:
            return None

        task.status = "CANCELLED"
        task.cancelledAt = datetime.utcnow()
        task.cancelledById = cancelled_by_id
        task.cancellationReason = reason
        task.updatedAt = datetime.utcnow()

        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)

        return task

    def get_pending_tasks(
        self,
        location_id: Optional[UUID] = None,
        company_id: Optional[UUID] = None,
        assigned_to_id: Optional[UUID] = None,
        limit: int = 50
    ) -> List[PutawayTask]:
        """Get pending putaway tasks."""
        query = select(PutawayTask).where(
            PutawayTask.status.in_(["PENDING", "ASSIGNED", "IN_PROGRESS"])
        )

        if location_id:
            query = query.where(PutawayTask.locationId == location_id)

        if company_id:
            query = query.where(PutawayTask.companyId == company_id)

        if assigned_to_id:
            query = query.where(PutawayTask.assignedToId == assigned_to_id)

        query = query.order_by(PutawayTask.priority, PutawayTask.createdAt)
        query = query.limit(limit)

        return list(self.session.exec(query).all())

    def get_task_summary(
        self,
        location_id: Optional[UUID] = None,
        company_id: Optional[UUID] = None
    ) -> dict:
        """Get summary of putaway tasks."""
        base_query = select(func.count(PutawayTask.id))

        if location_id:
            base_query = base_query.where(PutawayTask.locationId == location_id)
        if company_id:
            base_query = base_query.where(PutawayTask.companyId == company_id)

        pending = self.session.exec(
            base_query.where(PutawayTask.status == "PENDING")
        ).one()

        assigned = self.session.exec(
            base_query.where(PutawayTask.status == "ASSIGNED")
        ).one()

        in_progress = self.session.exec(
            base_query.where(PutawayTask.status == "IN_PROGRESS")
        ).one()

        completed_today = self.session.exec(
            base_query
            .where(PutawayTask.status == "COMPLETED")
            .where(PutawayTask.completedAt >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
        ).one()

        return {
            "pending": pending,
            "assigned": assigned,
            "inProgress": in_progress,
            "completedToday": completed_today,
            "total": pending + assigned + in_progress
        }
