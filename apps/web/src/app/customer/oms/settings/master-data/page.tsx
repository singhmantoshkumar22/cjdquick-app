"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Download,
  X,
  Package,
  Tag,
  Users,
  FileText,
} from "lucide-react";

type DataType = "skus" | "categories" | "vendors" | "reasons";

interface MasterDataItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  [key: string]: string | undefined;
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<DataType>("skus");
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/oms/settings/master-data?type=${activeTab}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data.items || getDemoData());
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      setData(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoData = (): MasterDataItem[] => {
    switch (activeTab) {
      case "skus":
        return [
          { id: "1", code: "SKU-001", name: "Wireless Mouse - Black", category: "Electronics", vendor: "TechSupply Co", price: "₹799", status: "ACTIVE", createdAt: "2023-06-15" },
          { id: "2", code: "SKU-002", name: "USB Keyboard - Mechanical", category: "Electronics", vendor: "TechSupply Co", price: "₹1,499", status: "ACTIVE", createdAt: "2023-06-15" },
          { id: "3", code: "SKU-003", name: "Monitor Stand - Adjustable", category: "Accessories", vendor: "Office Plus", price: "₹2,299", status: "ACTIVE", createdAt: "2023-07-20" },
          { id: "4", code: "SKU-004", name: "Laptop Sleeve 15 inch", category: "Accessories", vendor: "BagMart", price: "₹599", status: "ACTIVE", createdAt: "2023-08-10" },
          { id: "5", code: "SKU-005", name: "USB-C Hub 7-in-1", category: "Electronics", vendor: "TechSupply Co", price: "₹1,999", status: "INACTIVE", createdAt: "2023-09-05" },
        ];
      case "categories":
        return [
          { id: "1", code: "CAT-001", name: "Electronics", description: "Electronic devices and accessories", skuCount: "456", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "2", code: "CAT-002", name: "Apparel", description: "Clothing and fashion items", skuCount: "389", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "3", code: "CAT-003", name: "Home & Kitchen", description: "Home decor and kitchen items", skuCount: "312", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "4", code: "CAT-004", name: "Beauty", description: "Beauty and personal care", skuCount: "189", status: "ACTIVE", createdAt: "2023-02-15" },
          { id: "5", code: "CAT-005", name: "Sports", description: "Sports equipment and accessories", skuCount: "110", status: "ACTIVE", createdAt: "2023-03-20" },
        ];
      case "vendors":
        return [
          { id: "1", code: "VND-001", name: "TechSupply Co", contact: "Rajesh Kumar", email: "rajesh@techsupply.com", phone: "+91 98765 43210", status: "ACTIVE", createdAt: "2023-01-15" },
          { id: "2", code: "VND-002", name: "Office Plus", contact: "Anita Sharma", email: "anita@officeplus.com", phone: "+91 98765 43211", status: "ACTIVE", createdAt: "2023-02-01" },
          { id: "3", code: "VND-003", name: "BagMart", contact: "Suresh Patel", email: "suresh@bagmart.com", phone: "+91 98765 43212", status: "ACTIVE", createdAt: "2023-03-10" },
          { id: "4", code: "VND-004", name: "Fashion Hub", contact: "Priya Gupta", email: "priya@fashionhub.com", phone: "+91 98765 43213", status: "INACTIVE", createdAt: "2023-04-05" },
        ];
      case "reasons":
        return [
          { id: "1", code: "RET-001", name: "Product Damaged", type: "RETURN", description: "Item received in damaged condition", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "2", code: "RET-002", name: "Wrong Product", type: "RETURN", description: "Received different product than ordered", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "3", code: "RET-003", name: "Quality Issue", type: "RETURN", description: "Product quality not as expected", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "4", code: "CAN-001", name: "Customer Request", type: "CANCELLATION", description: "Customer requested cancellation", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "5", code: "CAN-002", name: "Out of Stock", type: "CANCELLATION", description: "Item out of stock", status: "ACTIVE", createdAt: "2023-01-01" },
          { id: "6", code: "ADJ-001", name: "Inventory Correction", type: "ADJUSTMENT", description: "Physical count adjustment", status: "ACTIVE", createdAt: "2023-01-01" },
        ];
      default:
        return [];
    }
  };

  const tabs = [
    { id: "skus" as DataType, label: "SKUs", icon: Package },
    { id: "categories" as DataType, label: "Categories", icon: Tag },
    { id: "vendors" as DataType, label: "Vendors", icon: Users },
    { id: "reasons" as DataType, label: "Reason Codes", icon: FileText },
  ];

  const filteredData = data.filter((item) => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getColumns = () => {
    switch (activeTab) {
      case "skus":
        return ["Code", "Name", "Category", "Vendor", "Price", "Status"];
      case "categories":
        return ["Code", "Name", "Description", "SKU Count", "Status"];
      case "vendors":
        return ["Code", "Name", "Contact", "Email", "Phone", "Status"];
      case "reasons":
        return ["Code", "Name", "Type", "Description", "Status"];
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
          <p className="text-gray-600">Manage SKUs, categories, vendors, and reason codes</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {getColumns().map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={getColumns().length + 1} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={getColumns().length + 1} className="px-6 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {activeTab === "skus" && (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.vendor}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.price}</td>
                    </>
                  )}
                  {activeTab === "categories" && (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.skuCount}</td>
                    </>
                  )}
                  {activeTab === "vendors" && (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.contact}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.phone}</td>
                    </>
                  )}
                  {activeTab === "reasons" && (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === "RETURN" ? "bg-orange-100 text-orange-800" :
                          item.type === "CANCELLATION" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                    </>
                  )}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? `Edit ${tabs.find((t) => t.id === activeTab)?.label.slice(0, -1)}` : `Add New ${tabs.find((t) => t.id === activeTab)?.label.slice(0, -1)}`}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  defaultValue={editingItem?.code}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  defaultValue={editingItem?.name}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter name"
                />
              </div>
              {activeTab !== "skus" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    defaultValue={editingItem?.description}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows={2}
                    placeholder="Enter description"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  defaultValue={editingItem?.status || "ACTIVE"}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingItem ? "Update" : "Add"}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
