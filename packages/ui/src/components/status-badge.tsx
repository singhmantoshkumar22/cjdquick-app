"use client";

import { cn } from "../utils";

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Order Created",
  PARTNER_ASSIGNED: "Partner Assigned",
  AWB_GENERATED: "AWB Generated",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKUP_PENDING: "Pickup Pending",
  PICKED: "Picked",
  PACKING: "Packing",
  PACKED: "Packed",
  LABELLED: "Labelled",
  READY_TO_DISPATCH: "Ready to Dispatch",
  DISPATCHED: "Dispatched",
  HANDED_OVER: "Handed Over",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  NDR: "NDR",
  RTO_INITIATED: "RTO Initiated",
  RTO_IN_TRANSIT: "RTO In Transit",
  RTO_DELIVERED: "RTO Delivered",
  CANCELLED: "Cancelled",
  LOST: "Lost",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CREATED: { bg: "bg-gray-100", text: "text-gray-700" },
  PARTNER_ASSIGNED: { bg: "bg-blue-100", text: "text-blue-700" },
  AWB_GENERATED: { bg: "bg-blue-100", text: "text-blue-700" },
  PICKUP_SCHEDULED: { bg: "bg-purple-100", text: "text-purple-700" },
  PICKUP_PENDING: { bg: "bg-purple-100", text: "text-purple-700" },
  PICKED: { bg: "bg-purple-100", text: "text-purple-700" },
  PACKING: { bg: "bg-indigo-100", text: "text-indigo-700" },
  PACKED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  LABELLED: { bg: "bg-indigo-100", text: "text-indigo-700" },
  READY_TO_DISPATCH: { bg: "bg-orange-100", text: "text-orange-700" },
  DISPATCHED: { bg: "bg-orange-100", text: "text-orange-700" },
  HANDED_OVER: { bg: "bg-orange-100", text: "text-orange-700" },
  IN_TRANSIT: { bg: "bg-teal-100", text: "text-teal-700" },
  OUT_FOR_DELIVERY: { bg: "bg-teal-100", text: "text-teal-700" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-700" },
  NDR: { bg: "bg-amber-100", text: "text-amber-700" },
  RTO_INITIATED: { bg: "bg-red-100", text: "text-red-700" },
  RTO_IN_TRANSIT: { bg: "bg-red-100", text: "text-red-700" },
  RTO_DELIVERED: { bg: "bg-red-100", text: "text-red-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-700" },
  LOST: { bg: "bg-red-100", text: "text-red-700" },
};
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  XCircle,
  Clock,
  MapPin,
  Send,
  ClipboardCheck,
} from "lucide-react";

const STATUS_ICONS: Record<string, React.ElementType> = {
  CREATED: Package,
  PARTNER_ASSIGNED: ClipboardCheck,
  AWB_GENERATED: ClipboardCheck,
  PICKUP_SCHEDULED: Clock,
  PICKUP_PENDING: Clock,
  PICKED: ClipboardCheck,
  PACKING: Package,
  PACKED: Package,
  LABELLED: Package,
  READY_TO_DISPATCH: Send,
  DISPATCHED: Send,
  HANDED_OVER: Send,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: CheckCircle,
  NDR: AlertCircle,
  RTO_INITIATED: RotateCcw,
  RTO_IN_TRANSIT: RotateCcw,
  RTO_DELIVERED: RotateCcw,
  CANCELLED: XCircle,
  LOST: XCircle,
};

export interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.CREATED;
  const label = STATUS_LABELS[status] || status;
  const Icon = STATUS_ICONS[status] || Package;

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  );
}
