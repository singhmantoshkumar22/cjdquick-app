"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Mail,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface OrderEvent {
  id: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  awbNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  packageDetails: {
    weight: number;
    dimensions: string;
    productName: string;
  };
  paymentMode: string;
  totalAmount: number;
  codAmount: number;
  createdAt: string;
  estimatedDelivery: string;
  events: OrderEvent[];
}

const statusColors: Record<string, string> = {
  DELIVERED: "bg-green-100 text-green-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  PICKED: "bg-indigo-100 text-indigo-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  RTO_INITIATED: "bg-orange-100 text-orange-800",
};

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with demo data
    setTimeout(() => {
      setOrder({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8).toUpperCase()}`,
        awbNumber: `AWB${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        status: "IN_TRANSIT",
        customerName: "Rahul Sharma",
        customerPhone: "+91 9876543210",
        customerEmail: "rahul.sharma@email.com",
        shippingAddress: {
          line1: "123, Green Valley Apartments",
          line2: "Sector 45, Near City Mall",
          city: "Gurugram",
          state: "Haryana",
          pincode: "122003",
        },
        packageDetails: {
          weight: 0.5,
          dimensions: "20 x 15 x 10 cm",
          productName: "Electronics - Mobile Accessories",
        },
        paymentMode: "COD",
        totalAmount: 1499,
        codAmount: 1499,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
          {
            id: "1",
            status: "IN_TRANSIT",
            location: "Delhi Hub",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            description: "Package arrived at Delhi Hub",
          },
          {
            id: "2",
            status: "IN_TRANSIT",
            location: "Mumbai Origin Hub",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            description: "Package departed from Mumbai Origin Hub",
          },
          {
            id: "3",
            status: "PICKED",
            location: "Mumbai",
            timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            description: "Package picked up from seller",
          },
          {
            id: "4",
            status: "PICKUP_SCHEDULED",
            location: "Mumbai",
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            description: "Pickup scheduled",
          },
          {
            id: "5",
            status: "CREATED",
            location: "System",
            timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
            description: "Order created",
          },
        ],
      });
      setLoading(false);
    }, 500);
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
        <Link href="/portal/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>AWB: {order.awbNumber}</span>
              <button onClick={() => copyToClipboard(order.awbNumber)} className="hover:text-gray-700">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Label
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Support
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-400" />
              Tracking History
            </h2>
            <div className="relative">
              {order.events.map((event, index) => (
                <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                    {index < order.events.length - 1 && (
                      <div className="absolute top-3 left-1.5 w-px h-full -ml-px bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{event.description}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              Package Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">{order.packageDetails.productName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-medium">{order.packageDetails.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dimensions</p>
                <p className="font-medium">{order.packageDetails.dimensions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Mode</p>
                <p className="font-medium">{order.paymentMode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-gray-500">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-sm">{order.customerPhone}</span>
              </div>
              {order.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">{order.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Value</span>
                <span className="font-medium">Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
              {order.paymentMode === "COD" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">COD Amount</span>
                  <span className="font-medium">Rs. {order.codAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Delivery</span>
                <span className="font-medium text-green-600">
                  {new Date(order.estimatedDelivery).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <RefreshCw className="h-4 w-4" />
                Request Reattempt
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <AlertCircle className="h-4 w-4" />
                Initiate RTO
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="h-4 w-4" />
                Raise Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
