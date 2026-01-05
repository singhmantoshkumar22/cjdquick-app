"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Printer,
  Download,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  User,
  Scale,
  Box,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  Card,
  Button,
  StatusBadge,
  Badge,
} from "@cjdquick/ui";

interface OrderEvent {
  id: string;
  status: string;
  statusText: string;
  location: string | null;
  remarks: string | null;
  eventTime: string;
}

interface Order {
  id: string;
  orderNumber: string;
  awbNumber: string | null;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryCity: string;
  deliveryState: string;
  originPincode: string;
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  volumetricWeight: number | null;
  chargeableWeight: number | null;
  itemDescription: string;
  itemValue: number;
  itemQuantity: number;
  itemSku: string | null;
  paymentMode: string;
  codAmount: number;
  clientOrderId: string | null;
  notes: string | null;
  labelUrl: string | null;
  trackingUrl: string | null;
  expectedDeliveryDate: string | null;
  manifestedAt: string | null;
  pickedAt: string | null;
  deliveredAt: string | null;
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
  } | null;
  partner: {
    id: string;
    name: string;
    displayName: string;
    code: string;
  } | null;
  events: OrderEvent[];
}

async function fetchOrder(id: string): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`/api/client/orders/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

async function cancelOrder(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/client/orders/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to cancel order");
  return res.json();
}

const STATUS_ICONS: Record<string, any> = {
  CREATED: Package,
  MANIFESTED: Package,
  PICKUP_SCHEDULED: Clock,
  OUT_FOR_PICKUP: Truck,
  PICKED: CheckCircle,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  RTO: AlertTriangle,
  CANCELLED: XCircle,
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-order", orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-order", orderId] });
    },
  });

  const order = data?.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-400" />
        <p className="mt-4 text-gray-600">Order not found</p>
        <Link href="/client/orders">
          <Button variant="outline" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const canCancel = ["CREATED", "MANIFESTED"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            {order.awbNumber && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">AWB:</span>
                <span className="text-sm font-medium">{order.awbNumber}</span>
                <button
                  onClick={() => copyToClipboard(order.awbNumber!)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Copy className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {order.labelUrl && (
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
          )}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Track
              </Button>
            </a>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Are you sure you want to cancel this order?")) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Customer Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Delivery Details
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {order.customerPhone}
                </p>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {order.customerEmail}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <span>
                    {order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState} - {order.deliveryPincode}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {/* Package Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="h-5 w-5" />
              Package Details
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Item Description</p>
                <p className="font-medium">{order.itemDescription}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{order.itemQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Item Value</p>
                <p className="font-medium">₹{order.itemValue.toLocaleString()}</p>
              </div>
              {order.itemSku && (
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">{order.itemSku}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Dead Weight</p>
                <p className="font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gray-400" />
                  {order.weightKg} kg
                </p>
              </div>
              {order.lengthCm && order.widthCm && order.heightCm && (
                <div>
                  <p className="text-sm text-gray-500">Dimensions</p>
                  <p className="font-medium">
                    {order.lengthCm} x {order.widthCm} x {order.heightCm} cm
                  </p>
                </div>
              )}
              {order.volumetricWeight && (
                <div>
                  <p className="text-sm text-gray-500">Volumetric Weight</p>
                  <p className="font-medium">{order.volumetricWeight.toFixed(2)} kg</p>
                </div>
              )}
              {order.chargeableWeight && (
                <div>
                  <p className="text-sm text-gray-500">Chargeable Weight</p>
                  <p className="font-medium text-primary-600">{order.chargeableWeight.toFixed(2)} kg</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Payment Mode</p>
                <Badge variant={order.paymentMode === "COD" ? "warning" : "info"}>
                  {order.paymentMode}
                </Badge>
              </div>
              {order.paymentMode === "COD" && (
                <div>
                  <p className="text-sm text-gray-500">COD Amount</p>
                  <p className="font-medium text-lg">₹{order.codAmount.toLocaleString()}</p>
                </div>
              )}
              {order.clientOrderId && (
                <div>
                  <p className="text-sm text-gray-500">Client Order ID</p>
                  <p className="font-medium">{order.clientOrderId}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Tracking Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tracking History
            </h2>
            {order.events.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tracking events yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {order.events.map((event, index) => {
                    const Icon = STATUS_ICONS[event.status] || Clock;
                    const isFirst = index === 0;
                    return (
                      <div key={event.id} className="relative flex gap-4">
                        <div
                          className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                            isFirst
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${isFirst ? "text-gray-900" : "text-gray-600"}`}>
                              {event.statusText}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.eventTime).toLocaleString()}
                            </p>
                          </div>
                          {event.location && (
                            <p className="text-sm text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {event.location}
                            </p>
                          )}
                          {event.remarks && (
                            <p className="text-sm text-gray-500 mt-1">{event.remarks}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              {order.manifestedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Manifested</span>
                  <span className="font-medium">
                    {new Date(order.manifestedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {order.pickedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Picked Up</span>
                  <span className="font-medium">
                    {new Date(order.pickedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {order.expectedDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Delivery</span>
                  <span className="font-medium text-primary-600">
                    {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivered</span>
                  <span className="font-medium text-green-600">
                    {new Date(order.deliveredAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Partner Info */}
          {order.partner && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Courier Partner
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{order.partner.displayName}</p>
                <p className="text-sm text-gray-500">Code: {order.partner.code}</p>
              </div>
            </Card>
          )}

          {/* Origin Warehouse */}
          {order.warehouse && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Pickup Location
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{order.warehouse.name}</p>
                <p className="text-sm text-gray-500">
                  {order.warehouse.address}, {order.warehouse.city}, {order.warehouse.state} - {order.warehouse.pincode}
                </p>
                <p className="text-sm text-gray-500">
                  Contact: {order.warehouse.contactName} ({order.warehouse.contactPhone})
                </p>
              </div>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
