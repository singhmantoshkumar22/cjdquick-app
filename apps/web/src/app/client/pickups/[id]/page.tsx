"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  Package,
  MapPin,
  Phone,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Card, Button, Badge, StatusBadge } from "@cjdquick/ui";

interface PickupOrder {
  id: string;
  orderNumber: string;
  awbNumber: string | null;
  status: string;
  customerName: string;
  deliveryCity: string;
}

interface Pickup {
  id: string;
  pickupNumber: string;
  status: string;
  requestedDate: string;
  timeSlotStart: string | null;
  timeSlotEnd: string | null;
  expectedAwbs: number;
  expectedWeight: number | null;
  pickedAwbs: number;
  pickedWeight: number | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  assignedAgentPhone: string | null;
  pickedAt: string | null;
  failedReason: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactName: string;
    contactPhone: string;
  };
  orders: PickupOrder[];
}

async function fetchPickup(id: string): Promise<{ success: boolean; data: Pickup }> {
  const res = await fetch(`/api/client/pickups/${id}`);
  if (!res.ok) throw new Error("Failed to fetch pickup");
  return res.json();
}

async function cancelPickup(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/client/pickups/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to cancel pickup");
  return res.json();
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: "Scheduled", color: "info", icon: Calendar },
  OUT_FOR_PICKUP: { label: "Out for Pickup", color: "warning", icon: Truck },
  PICKED: { label: "Picked", color: "success", icon: CheckCircle },
  PARTIALLY_PICKED: { label: "Partially Picked", color: "warning", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "danger", icon: XCircle },
  FAILED: { label: "Failed", color: "danger", icon: AlertTriangle },
};

export default function PickupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pickupId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-pickup", pickupId],
    queryFn: () => fetchPickup(pickupId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPickup(pickupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-pickup", pickupId] });
    },
  });

  const pickup = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !pickup) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-400" />
        <p className="mt-4 text-gray-600">Pickup not found</p>
        <Link href="/client/pickups">
          <Button variant="outline" className="mt-4">
            Back to Pickups
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[pickup.status];
  const canCancel = pickup.status === "SCHEDULED";
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client/pickups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {pickup.pickupNumber}
              </h1>
              <Badge variant={statusConfig?.color as any || "default"}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig?.label || pickup.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Scheduled for {new Date(pickup.requestedDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Are you sure you want to cancel this pickup?")) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Pickup
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Pickup Location */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Pickup Location
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{pickup.warehouse.name}</p>
                <p className="text-sm text-gray-500">{pickup.warehouse.code}</p>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                <span>
                  {pickup.warehouse.address}, {pickup.warehouse.city}, {pickup.warehouse.state} - {pickup.warehouse.pincode}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {pickup.contactName || pickup.warehouse.contactName}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {pickup.contactPhone || pickup.warehouse.contactPhone}
                </div>
              </div>
            </div>
          </Card>

          {/* Schedule Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Details
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Requested Date</p>
                <p className="font-medium">
                  {new Date(pickup.requestedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {pickup.timeSlotStart && (
                <div>
                  <p className="text-sm text-gray-500">Time Slot</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {pickup.timeSlotStart} - {pickup.timeSlotEnd}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Expected AWBs</p>
                <p className="font-medium">{pickup.expectedAwbs || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Weight</p>
                <p className="font-medium">
                  {pickup.expectedWeight ? `${pickup.expectedWeight} kg` : "-"}
                </p>
              </div>
            </div>
          </Card>

          {/* Pickup Results (if picked) */}
          {["PICKED", "PARTIALLY_PICKED"].includes(pickup.status) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Pickup Results
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Picked AWBs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pickup.pickedAwbs}
                    {pickup.expectedAwbs > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        /{pickup.expectedAwbs}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Picked Weight</p>
                  <p className="text-2xl font-bold">
                    {pickup.pickedWeight ? `${pickup.pickedWeight} kg` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Picked At</p>
                  <p className="font-medium">
                    {pickup.pickedAt
                      ? new Date(pickup.pickedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Failed Reason */}
          {pickup.status === "FAILED" && pickup.failedReason && (
            <Card className="p-6 border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pickup Failed
              </h2>
              <p className="text-red-700">{pickup.failedReason}</p>
            </Card>
          )}

          {/* Associated Orders */}
          {pickup.orders && pickup.orders.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Associated Orders ({pickup.orders.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Destination
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pickup.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/client/orders/${order.id}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          {order.awbNumber && (
                            <p className="text-xs text-gray-500">{order.awbNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{order.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {order.deliveryCity}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Notes */}
          {pickup.notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{pickup.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pickup Summary */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={statusConfig?.color as any || "default"} size="sm">
                  {statusConfig?.label || pickup.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {new Date(pickup.createdAt).toLocaleDateString()}
                </span>
              </div>
              {pickup.pickedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Picked At</span>
                  <span className="font-medium">
                    {new Date(pickup.pickedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Assigned Agent */}
          {pickup.assignedAgentName && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Pickup Agent
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{pickup.assignedAgentName}</p>
                {pickup.assignedAgentPhone && (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {pickup.assignedAgentPhone}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
