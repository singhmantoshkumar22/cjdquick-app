"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Package,
  Truck,
  CheckCircle,
  RefreshCw,
  FileText,
} from "lucide-react";

interface DeliveryShipping {
  id: string;
  deliveryNo: string;
  orderNumber: string;
  extOrderNumber: string;
  trackingNo: string;
  orderDate: string;
  channel: string;
  transporter: string;
  orderType: string;
  orderStatus: string;
  shipByDate: string;
}

const demoDeliveries: DeliveryShipping[] = [
  { id: "1", deliveryNo: "DEL-2024-001234", orderNumber: "ORD-2024-001234", extOrderNumber: "EXT-5678", trackingNo: "AWB123456", orderDate: "2024-01-08", channel: "Website", transporter: "Delhivery", orderType: "Prepaid", orderStatus: "NEW", shipByDate: "2024-01-10" },
  { id: "2", deliveryNo: "DEL-2024-001235", orderNumber: "ORD-2024-001235", extOrderNumber: "EXT-5679", trackingNo: "AWB123457", orderDate: "2024-01-08", channel: "Amazon", transporter: "BlueDart", orderType: "COD", orderStatus: "PICKLIST_CREATED", shipByDate: "2024-01-10" },
  { id: "3", deliveryNo: "DEL-2024-001236", orderNumber: "ORD-2024-001236", extOrderNumber: "EXT-5680", trackingNo: "AWB123458", orderDate: "2024-01-08", channel: "Flipkart", transporter: "FedEx", orderType: "Prepaid", orderStatus: "PICK_PACK", shipByDate: "2024-01-09" },
  { id: "4", deliveryNo: "DEL-2024-001237", orderNumber: "ORD-2024-001237", extOrderNumber: "EXT-5681", trackingNo: "AWB123459", orderDate: "2024-01-07", channel: "Website", transporter: "Ecom Express", orderType: "COD", orderStatus: "SHIPPED", shipByDate: "2024-01-09" },
];

const tabs = [
  { id: "new", label: "New", count: 24, color: "bg-blue-500" },
  { id: "picklist_created", label: "Picklist Created", count: 18, color: "bg-orange-500" },
  { id: "pick_pack", label: "Pick Pack", count: 12, color: "bg-yellow-500" },
  { id: "mp_label_refetch", label: "MP Label Refetched", count: 3, color: "bg-purple-500" },
  { id: "shipped", label: "Shipped", count: 156, color: "bg-green-500" },
  { id: "all", label: "All", count: 213, color: "bg-gray-500" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "bg-blue-100", text: "text-blue-700" },
  PICKLIST_CREATED: { bg: "bg-orange-100", text: "text-orange-700" },
  PICK_PACK: { bg: "bg-yellow-100", text: "text-yellow-700" },
  SHIPPED: { bg: "bg-green-100", text: "text-green-700" },
  MP_LABEL_REFETCH: { bg: "bg-purple-100", text: "text-purple-700" },
};

export default function DeliveryShippingPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [deliveries, setDeliveries] = useState<DeliveryShipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  useEffect(() => {
    fetchDeliveries();
  }, [activeTab]);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(`/api/oms/wms/delivery-shipping?tab=${activeTab}`);
      const result = await response.json();
      if (result.success && result.data?.deliveries) {
        setDeliveries(result.data.deliveries);
      } else {
        setDeliveries(demoDeliveries);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      setDeliveries(demoDeliveries);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePicklist = async () => {
    if (selectedDeliveries.length === 0) return;
    try {
      await fetch("/api/oms/wms/delivery-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_picklist", deliveryIds: selectedDeliveries }),
      });
      fetchDeliveries();
      setSelectedDeliveries([]);
    } catch (error) {
      console.error("Error generating picklist:", error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDeliveries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getActionButtons = () => {
    switch (activeTab) {
      case "new":
        return (
          <button
            onClick={handleGeneratePicklist}
            disabled={selectedDeliveries.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <ClipboardCheck className="w-4 h-4" />
            Generate Picklist
          </button>
        );
      case "picklist_created":
        return (
          <>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              <Package className="w-4 h-4" />
              Pack Order
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <Printer className="w-4 h-4" />
              Print Picklist
            </button>
          </>
        );
      case "pick_pack":
        return (
          <>
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Truck className="w-4 h-4" />
              Ship Order
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
              <FileText className="w-4 h-4" />
              Generate Manifest
            </button>
          </>
        );
      case "mp_label_refetch":
        return (
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <RefreshCw className="w-4 h-4" />
            Refetch Labels
          </button>
        );
      case "shipped":
        return (
          <>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Update POD
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
              Reship
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Delivery Shipping</h1>
          <p className="text-sm text-gray-500">Manage order processing, picklist generation, and shipping</p>
        </div>
        <div className="flex gap-2">
          {getActionButtons()}
          <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedDeliveries([]); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id ? "bg-white/20" : tab.color + " text-white"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Delivery No</label>
            <input type="text" placeholder="Search..." className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order Number</label>
            <input type="text" placeholder="Order no..." className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Channel</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Channels</option>
              <option>Website</option>
              <option>Amazon</option>
              <option>Flipkart</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transporter</label>
            <select className="w-full px-3 py-2 text-sm border rounded-lg">
              <option>All Transporters</option>
              <option>Delhivery</option>
              <option>BlueDart</option>
              <option>FedEx</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order Date</label>
            <input type="date" className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div className="flex items-end gap-2">
            <button className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </button>
            <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Reset</button>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading deliveries...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Delivery No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Order Number</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tracking No</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Channel</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Transporter</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Order Type</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Ship By</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedDeliveries.includes(delivery.id)}
                          onChange={() => toggleSelection(delivery.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">{delivery.deliveryNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{delivery.orderNumber}</p>
                        <p className="text-xs text-gray-500">{delivery.extOrderNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{delivery.trackingNo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{delivery.channel}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{delivery.transporter}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          delivery.orderType === "COD" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                        }`}>
                          {delivery.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${statusColors[delivery.orderStatus]?.bg} ${statusColors[delivery.orderStatus]?.text}`}>
                          {delivery.orderStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{delivery.shipByDate}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600"><Printer className="w-4 h-4" /></button>
                          <button className="p-1 text-gray-400 hover:text-green-600"><FileText className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {selectedDeliveries.length > 0 && <span className="font-medium">{selectedDeliveries.length} selected | </span>}
                Showing 1-{deliveries.length} of {deliveries.length} deliveries
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</span>
                <button className="p-1 border rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
