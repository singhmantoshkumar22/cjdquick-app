"use client";

import { useState } from "react";
import {
  Handshake,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Truck,
  Users,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Star,
  Award,
} from "lucide-react";
import { Card, Button, Badge } from "@cjdquick/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FreightExchangePage() {
  const [activeTab, setActiveTab] = useState<"requests" | "bids" | "carriers">("requests");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch freight requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["freight-requests"],
    queryFn: async () => {
      const res = await fetch("/api/freight-exchange");
      return res.json();
    },
  });

  // Fetch bids
  const { data: bidsData } = useQuery({
    queryKey: ["freight-bids"],
    queryFn: async () => {
      const res = await fetch("/api/freight-exchange?type=bids");
      return res.json();
    },
  });

  // Fetch carriers
  const { data: carriersData } = useQuery({
    queryKey: ["freight-carriers"],
    queryFn: async () => {
      const res = await fetch("/api/freight-exchange?type=carriers");
      return res.json();
    },
  });

  const requests = requestsData?.data?.items || [];
  const summary = requestsData?.data?.summary || {};
  const bids = bidsData?.data?.items || [];
  const carriers = carriersData?.data?.items || [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="primary">Open</Badge>;
      case "BIDDING":
        return <Badge variant="warning">Bidding</Badge>;
      case "AWARDED":
        return <Badge variant="success">Awarded</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Freight Exchange</h1>
          <p className="text-gray-500">
            Partner bidding marketplace for freight capacity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold">{summary.total || 0}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open for Bidding</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.open || 0}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Awarded</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.awarded || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{summary.completed || 0}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Award className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Freight Requests
        </button>
        <button
          onClick={() => setActiveTab("bids")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "bids"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Bids ({bids.length})
        </button>
        <button
          onClick={() => setActiveTab("carriers")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "carriers"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Carriers ({carriers.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map((request: any) => (
              <Card key={request.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium">
                          {request.requestNumber}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>{request.originCity}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>{request.destinationCity}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Vehicle:</span>{" "}
                          <span className="font-medium">{request.vehicleType || "Any"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Weight:</span>{" "}
                          <span className="font-medium">{request.totalWeightKg} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Shipment:</span>{" "}
                          <span className="font-medium">{request.shipmentType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(request.baseBudget || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Base Budget</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {request._count?.bids || 0} bids
                      </span>
                    </div>
                  </div>
                </div>
                {request.bids?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Top Bids:
                    </p>
                    <div className="flex gap-3">
                      {request.bids
                        .sort((a: any, b: any) => a.totalAmount - b.totalAmount)
                        .slice(0, 3)
                        .map((bid: any, index: number) => (
                          <div
                            key={bid.id}
                            className={`p-2 rounded-lg text-sm ${
                              bid.isLowestBid
                                ? "bg-green-50 border border-green-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {bid.isLowestBid && (
                                <Star className="h-3 w-3 text-green-600" />
                              )}
                              <span className="font-medium">{bid.carrierName}</span>
                            </div>
                            <div className="font-bold text-gray-900">
                              {formatCurrency(bid.totalAmount)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No freight requests</h3>
              <p className="text-gray-500 mt-1">
                Create your first freight request to start receiving bids
              </p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </Card>
          )}
        </div>
      )}

      {activeTab === "bids" && (
        <div className="space-y-4">
          {bids.length > 0 ? (
            bids.map((bid: any) => (
              <Card key={bid.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        bid.isLowestBid ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <DollarSign
                        className={`h-6 w-6 ${
                          bid.isLowestBid ? "text-green-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{bid.carrierName}</span>
                        {bid.isLowestBid && (
                          <Badge variant="success">Lowest Bid</Badge>
                        )}
                        <Badge
                          variant={
                            bid.status === "ACCEPTED"
                              ? "success"
                              : bid.status === "REJECTED"
                                ? "danger"
                                : "default"
                          }
                        >
                          {bid.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {bid.request?.originCity} → {bid.request?.destinationCity}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Base:</span>{" "}
                          <span className="font-medium">
                            {formatCurrency(bid.bidAmount || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fuel:</span>{" "}
                          <span className="font-medium">
                            {formatCurrency(bid.fuelSurcharge || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>{" "}
                          <span className="font-bold text-green-600">
                            {formatCurrency(bid.totalAmount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(bid.totalAmount || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {bid.vehicleType} • {bid.vehicleRegNo}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No bids yet</h3>
              <p className="text-gray-500 mt-1">
                Bids will appear here once carriers submit them
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "carriers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carriers.length > 0 ? (
            carriers.map((carrier: any) => (
              <Card key={carrier.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Truck className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Partner {carrier.partnerId?.slice(-6)}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium">
                          {carrier.overallRating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Bids:</span>{" "}
                        <span className="font-medium">
                          {carrier.totalBidsSubmitted || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Won:</span>{" "}
                        <span className="font-medium text-green-600">
                          {carrier.totalBidsWon || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>{" "}
                        <span className="font-medium">
                          {carrier.totalShipmentsCompleted || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Win Rate:</span>{" "}
                        <span className="font-medium">
                          {carrier.totalBidsSubmitted > 0
                            ? (
                                (carrier.totalBidsWon / carrier.totalBidsSubmitted) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No carriers registered</h3>
              <p className="text-gray-500 mt-1">
                Carrier profiles will appear as they participate in bidding
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
