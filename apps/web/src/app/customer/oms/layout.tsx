"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  RotateCcw,
  Truck,
  FileText,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  BarChart3,
  Users,
  MapPin,
  Warehouse,
  PackageCheck,
  ScanLine,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  Repeat,
  Route,
  FileBarChart,
  Ship,
  MapPinned,
  ScrollText,
  Upload,
  ClipboardX,
  Scan,
  PackageSearch,
  RefreshCw,
  MoreHorizontal,
  FolderInput,
  ArrowLeftRight,
  Globe,
  FileQuestion,
  Plus,
  Building2,
  PackageOpen,
  ListChecks,
  Boxes,
  Send,
  BarChart2,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  UserCog,
  Building,
  Plug,
  Shield,
  Database,
} from "lucide-react";

type DashboardType = "eretail" | "seller-panel";

const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/customer/oms/dashboard",
    hasDropdown: true,
    dropdownItems: [
      { id: "eretail", label: "eRetail Dashboard", href: "/customer/oms/dashboard?type=eretail" },
      { id: "seller-panel", label: "Seller Panel Dashboard", href: "/customer/oms/dashboard?type=seller-panel" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    icon: ClipboardList,
    href: "/customer/oms/orders",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    href: "/customer/oms/inventory",
  },
  {
    id: "wms",
    label: "WMS",
    icon: Warehouse,
    href: "/customer/oms/wms",
    hasDropdown: true,
    dropdownItems: [
      { id: "wms-dashboard", label: "WMS Dashboard", href: "/customer/oms/wms/dashboard", icon: LayoutDashboard },
      // Setup Section
      { id: "setup-header", label: "── Setup ──", href: "#", icon: Settings, isHeader: true },
      { id: "zones", label: "Zones", href: "/customer/oms/wms/setup/zones", icon: MapPin },
      { id: "bin-enquiry", label: "Bin Enquiry", href: "/customer/oms/wms/setup/bin-enquiry", icon: Search },
      { id: "bin-create", label: "Bin Create/Edit", href: "/customer/oms/wms/setup/bin-create", icon: Package },
      { id: "lottable-validation", label: "Lottable Validation", href: "/customer/oms/wms/setup/lottable", icon: ClipboardCheck },
      { id: "receipt-validation", label: "Receipt Validation", href: "/customer/oms/wms/setup/receipt-validation", icon: FileText },
      // Order Processing Section
      { id: "order-header", label: "── Order Processing ──", href: "#", icon: ClipboardList, isHeader: true },
      { id: "order-allocation", label: "Order Allocation", href: "/customer/oms/wms/order-processing/allocation", icon: ClipboardList },
      { id: "manifest", label: "Manifest", href: "/customer/oms/wms/order-processing/manifest", icon: FileText },
      { id: "delivery-shipping", label: "Delivery Shipping", href: "/customer/oms/wms/order-processing/delivery-shipping", icon: Truck },
      { id: "bulk-shipment", label: "Bulk Order Shipment", href: "/customer/oms/wms/order-processing/bulk-shipment", icon: Upload },
      { id: "manage-picklist", label: "Manage Picklist", href: "/customer/oms/wms/order-processing/manage-picklist", icon: ClipboardCheck },
      { id: "manage-picking", label: "Manage Picking", href: "/customer/oms/wms/order-processing/manage-picking", icon: ScanLine },
      // Inventory Section
      { id: "inventory-header", label: "── Inventory ──", href: "#", icon: Package, isHeader: true },
      { id: "inventory-view", label: "Inventory View", href: "/customer/oms/wms/inventory/view", icon: Package },
      { id: "inventory-move-history", label: "Inventory Move History", href: "/customer/oms/wms/inventory/move-history", icon: FileText },
      { id: "inventory-move", label: "Inventory Move", href: "/customer/oms/wms/inventory/move", icon: ArrowDownToLine },
      { id: "inventory-move-scan", label: "Inventory Move by Scan", href: "/customer/oms/wms/inventory/move-scan", icon: ScanLine },
      { id: "cycle-count", label: "Cycle Count", href: "/customer/oms/wms/inventory/cycle-count", icon: Repeat },
      { id: "stock-adjustment", label: "Stock Adjustment", href: "/customer/oms/wms/inventory/stock-adjustment", icon: BarChart3 },
    ],
  },
  {
    id: "logistics",
    label: "Logistics",
    icon: Route,
    href: "/customer/oms/logistics",
    hasDropdown: true,
    dropdownItems: [
      { id: "logistics-dashboard", label: "Logistics Dashboard", href: "/customer/oms/logistics/dashboard", icon: LayoutDashboard },
      { id: "manage-awb", label: "Manage AWB", href: "/customer/oms/logistics/awb", icon: FileBarChart },
      { id: "transporter", label: "Transporter Preference", href: "/customer/oms/logistics/transporter", icon: Truck },
      { id: "service-pincode", label: "Service Pin Code", href: "/customer/oms/logistics/service-pincode", icon: MapPinned },
      { id: "bulk-upload", label: "Bulk Upload", href: "/customer/oms/logistics/bulk-upload", icon: Upload },
      { id: "inventory-log", label: "MP Inventory Log", href: "/customer/oms/logistics/inventory-log", icon: FileText },
      { id: "transhipment", label: "Transhipment", href: "/customer/oms/logistics/transhipment", icon: RefreshCw },
    ],
  },
  {
    id: "inbound",
    label: "Inbound",
    icon: ArrowDownToLine,
    href: "/customer/oms/inbound",
    hasDropdown: true,
    dropdownItems: [
      { id: "inbound-enquiry", label: "Inbound Enquiry", href: "/customer/oms/inbound/enquiry", icon: PackageSearch },
      { id: "inbound-create", label: "Inbound Create/Edit", href: "/customer/oms/inbound/create", icon: ClipboardCheck },
      { id: "inbound-realtime", label: "Inbound RealTime", href: "/customer/oms/inbound/realtime", icon: RefreshCw },
      { id: "inbound-qc", label: "Inbound QC", href: "/customer/oms/inbound/qc", icon: Scan },
      { id: "direct-inbound", label: "Direct Inbound", href: "/customer/oms/inbound/direct", icon: ArrowDownToLine },
      { id: "sto-inbound", label: "STO Inbound", href: "/customer/oms/inbound/sto", icon: Ship },
      { id: "return-inbound", label: "Return Inbound", href: "/customer/oms/inbound/return", icon: RotateCcw },
    ],
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    icon: MoreHorizontal,
    href: "/customer/oms/miscellaneous",
    hasDropdown: true,
    dropdownItems: [
      { id: "manage-putaway", label: "Manage Putaway", href: "/customer/oms/miscellaneous/putaway", icon: FolderInput },
    ],
  },
  {
    id: "returns",
    label: "Returns",
    icon: RotateCcw,
    href: "/customer/oms/returns",
    hasDropdown: true,
    dropdownItems: [
      // Return Section
      { id: "return-header", label: "── Return ──", href: "#", icon: RotateCcw, isHeader: true },
      { id: "rtv-enquiry", label: "RTV Enquiry", href: "/customer/oms/returns/rtv-enquiry", icon: PackageSearch },
      { id: "vendor-return", label: "Vendor Return Create/Edit", href: "/customer/oms/returns/vendor-return", icon: Building2 },
      { id: "return-enquiry", label: "Return Enquiry", href: "/customer/oms/returns/return-enquiry", icon: Search },
      { id: "return-create", label: "Return Create/Edit", href: "/customer/oms/returns/return-create", icon: ClipboardCheck },
      { id: "global-return-search", label: "Global Return Search", href: "/customer/oms/returns/global-search", icon: Globe },
      { id: "return-without-order", label: "Return w/o Order", href: "/customer/oms/returns/without-order", icon: FileQuestion },
      // Transfer Section
      { id: "transfer-header", label: "── Transfer ──", href: "#", icon: ArrowLeftRight, isHeader: true },
      { id: "sto-order-enquiry", label: "STO Order Enquiry", href: "/customer/oms/returns/sto-enquiry", icon: Search },
      { id: "sto-order-create", label: "STO Order Create/Edit", href: "/customer/oms/returns/sto-create", icon: Plus },
    ],
  },
  {
    id: "fulfillment",
    label: "Fulfillment",
    icon: Truck,
    href: "/customer/oms/fulfillment",
    hasDropdown: true,
    dropdownItems: [
      { id: "fulfillment-dashboard", label: "Fulfillment Dashboard", href: "/customer/oms/fulfillment/dashboard", icon: LayoutDashboard },
      { id: "fulfillment-orders", label: "Fulfillment Orders", href: "/customer/oms/fulfillment/orders", icon: ListChecks },
      { id: "packing-station", label: "Packing Station", href: "/customer/oms/fulfillment/packing", icon: PackageOpen },
      { id: "shipping-queue", label: "Shipping Queue", href: "/customer/oms/fulfillment/shipping", icon: Send },
      { id: "batch-processing", label: "Batch Processing", href: "/customer/oms/fulfillment/batch", icon: Boxes },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    href: "/customer/oms/reports",
    hasDropdown: true,
    dropdownItems: [
      { id: "reports-dashboard", label: "Reports Dashboard", href: "/customer/oms/reports/dashboard", icon: LayoutDashboard },
      { id: "sales-reports", label: "Sales Reports", href: "/customer/oms/reports/sales", icon: TrendingUp },
      { id: "inventory-reports", label: "Inventory Reports", href: "/customer/oms/reports/inventory", icon: BarChart2 },
      { id: "fulfillment-reports", label: "Fulfillment Reports", href: "/customer/oms/reports/fulfillment", icon: PieChart },
      { id: "returns-reports", label: "Returns Reports", href: "/customer/oms/reports/returns", icon: RotateCcw },
      { id: "custom-reports", label: "Custom Reports", href: "/customer/oms/reports/custom", icon: FileSpreadsheet },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/customer/oms/settings",
    hasDropdown: true,
    dropdownItems: [
      { id: "general-settings", label: "General Settings", href: "/customer/oms/settings/general", icon: Settings },
      { id: "user-management", label: "User Management", href: "/customer/oms/settings/users", icon: UserCog },
      { id: "location-settings", label: "Location Settings", href: "/customer/oms/settings/locations", icon: Building },
      { id: "integrations", label: "Integrations", href: "/customer/oms/settings/integrations", icon: Plug },
      { id: "permissions", label: "Permissions", href: "/customer/oms/settings/permissions", icon: Shield },
      { id: "master-data", label: "Master Data", href: "/customer/oms/settings/master-data", icon: Database },
    ],
  },
];

const topNavTabs = [
  { id: "inventory", label: "Inventory", href: "/customer/oms/inventory" },
  { id: "returns", label: "Returns", href: "/customer/oms/returns" },
];

export default function OMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [selectedLocation, setSelectedLocation] = useState("Headoffice");

  const isActive = (href: string) => pathname.startsWith(href.split("?")[0]);

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-56"
        } hidden md:flex flex-col bg-slate-800 text-white transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-slate-700">
          {!sidebarCollapsed && (
            <span className="font-semibold text-sm">OMS</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isDropdownOpen = openDropdowns[item.id];

            if (item.hasDropdown) {
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {isDropdownOpen && !sidebarCollapsed && (
                    <div className="bg-slate-900 py-1 max-h-96 overflow-y-auto">
                      {item.dropdownItems?.map((dropItem: any) => {
                        const DropIcon = dropItem.icon || LayoutDashboard;

                        // Render section headers
                        if (dropItem.isHeader) {
                          return (
                            <div
                              key={dropItem.id}
                              className="px-4 py-1.5 mt-2 first:mt-0 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                              {dropItem.label.replace(/─/g, "").trim()}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={dropItem.id}
                            href={dropItem.href}
                            className={`flex items-center gap-2 px-4 py-2 pl-11 text-xs transition-colors ${
                              isActive(dropItem.href)
                                ? "text-white bg-slate-700"
                                : "text-slate-400 hover:text-white hover:bg-slate-700"
                            }`}
                          >
                            <DropIcon className="w-3 h-3" />
                            {dropItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-56 bg-slate-800 text-white overflow-y-auto">
            <div className="flex items-center justify-between h-12 px-3 border-b border-slate-700">
              <span className="font-semibold text-sm">OMS</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="py-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-12 bg-white border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Top Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {topNavTabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                    isActive(tab.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Location Selector */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{selectedLocation}</span>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
              <select className="text-xs border rounded px-2 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Web Order No</option>
                <option>AWB No</option>
                <option>SKU</option>
              </select>
            </div>
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                className="w-32 px-3 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            </div>

            {/* Actions */}
            <button className="p-1.5 text-gray-500 hover:text-gray-700">
              <Bell className="w-4 h-4" />
            </button>
            <select className="text-xs border rounded px-2 py-1.5 focus:outline-none">
              <option>All</option>
              <option>Today</option>
              <option>This Week</option>
            </select>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 bg-gray-100">{children}</main>
      </div>
    </div>
  );
}
