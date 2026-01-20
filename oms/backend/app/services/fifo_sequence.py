"""
FIFO Sequence Service
Manages FIFO sequence assignment for inventory tracking
"""
from typing import Optional
from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Inventory


class FifoSequenceService:
    """
    Service for managing FIFO sequences on inventory records.
    FIFO sequence is used to determine the order of inventory consumption
    based on when it was received.
    """

    def __init__(self, session: Session):
        self.session = session

    def get_next_sequence(self, sku_id: UUID, location_id: UUID) -> int:
        """
        Get the next available FIFO sequence for a SKU at a location.
        Returns max(fifoSequence) + 1, or 1 if no existing inventory.
        """
        result = self.session.exec(
            select(func.max(Inventory.fifoSequence))
            .where(Inventory.skuId == sku_id)
            .where(Inventory.locationId == location_id)
        ).one()

        return (result or 0) + 1

    def assign_sequence(self, inventory: Inventory) -> int:
        """
        Assign a FIFO sequence to an inventory record.
        The sequence is unique per SKU+Location combination.
        """
        if inventory.fifoSequence is not None:
            return inventory.fifoSequence

        sequence = self.get_next_sequence(inventory.skuId, inventory.locationId)
        inventory.fifoSequence = sequence
        return sequence

    def reassign_sequences(self, sku_id: UUID, location_id: UUID) -> int:
        """
        Reassign FIFO sequences for all inventory records of a SKU at a location.
        Orders by createdAt to maintain temporal order.
        Returns the number of records updated.

        This is useful for:
        - Data migration when adding FIFO tracking to existing inventory
        - Correcting sequence gaps after deletions
        """
        # Get all inventory for this SKU+Location ordered by creation date
        inventory_records = self.session.exec(
            select(Inventory)
            .where(Inventory.skuId == sku_id)
            .where(Inventory.locationId == location_id)
            .where(Inventory.quantity > 0)  # Only active inventory
            .order_by(Inventory.createdAt)
        ).all()

        # Assign sequential numbers
        for idx, inv in enumerate(inventory_records, start=1):
            inv.fifoSequence = idx
            self.session.add(inv)

        return len(inventory_records)

    def bulk_reassign_all(self) -> dict:
        """
        Reassign FIFO sequences for ALL inventory records.
        Groups by SKU+Location and assigns sequences.
        Returns statistics about the operation.

        WARNING: This is an expensive operation. Use sparingly.
        """
        # Get distinct SKU+Location combinations
        distinct_pairs = self.session.exec(
            select(Inventory.skuId, Inventory.locationId)
            .distinct()
        ).all()

        stats = {
            "sku_location_pairs": len(distinct_pairs),
            "total_records_updated": 0
        }

        for sku_id, location_id in distinct_pairs:
            updated = self.reassign_sequences(sku_id, location_id)
            stats["total_records_updated"] += updated

        return stats

    def get_oldest_available(
        self,
        sku_id: UUID,
        location_id: UUID,
        required_qty: int
    ) -> list[Inventory]:
        """
        Get inventory records with the oldest FIFO sequences
        that have available quantity.
        Used for FIFO-based allocation.
        """
        # Query inventory ordered by fifoSequence ASC
        # Filter for records with available quantity
        inventory_records = self.session.exec(
            select(Inventory)
            .where(Inventory.skuId == sku_id)
            .where(Inventory.locationId == location_id)
            .where((Inventory.quantity - Inventory.reservedQty) > 0)
            .order_by(Inventory.fifoSequence.asc())
        ).all()

        result = []
        remaining_qty = required_qty

        for inv in inventory_records:
            if remaining_qty <= 0:
                break
            available = inv.quantity - inv.reservedQty
            if available > 0:
                result.append(inv)
                remaining_qty -= available

        return result

    def get_newest_available(
        self,
        sku_id: UUID,
        location_id: UUID,
        required_qty: int
    ) -> list[Inventory]:
        """
        Get inventory records with the newest FIFO sequences
        that have available quantity.
        Used for LIFO-based allocation.
        """
        # Query inventory ordered by fifoSequence DESC (newest first)
        inventory_records = self.session.exec(
            select(Inventory)
            .where(Inventory.skuId == sku_id)
            .where(Inventory.locationId == location_id)
            .where((Inventory.quantity - Inventory.reservedQty) > 0)
            .order_by(Inventory.fifoSequence.desc())
        ).all()

        result = []
        remaining_qty = required_qty

        for inv in inventory_records:
            if remaining_qty <= 0:
                break
            available = inv.quantity - inv.reservedQty
            if available > 0:
                result.append(inv)
                remaining_qty -= available

        return result

    def get_by_expiry(
        self,
        sku_id: UUID,
        location_id: UUID,
        required_qty: int
    ) -> list[Inventory]:
        """
        Get inventory records ordered by expiry date (earliest first).
        Used for FEFO (First Expired, First Out) allocation.
        Records without expiry dates are placed at the end.
        """
        # Query inventory ordered by expiryDate ASC (nulls last)
        inventory_records = self.session.exec(
            select(Inventory)
            .where(Inventory.skuId == sku_id)
            .where(Inventory.locationId == location_id)
            .where((Inventory.quantity - Inventory.reservedQty) > 0)
            .order_by(Inventory.expiryDate.asc().nullslast())
        ).all()

        result = []
        remaining_qty = required_qty

        for inv in inventory_records:
            if remaining_qty <= 0:
                break
            available = inv.quantity - inv.reservedQty
            if available > 0:
                result.append(inv)
                remaining_qty -= available

        return result
