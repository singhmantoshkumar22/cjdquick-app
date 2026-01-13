"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Truck,
  Users,
  Route,
  Navigation,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Package,
  ScanLine,
  Box,
  Handshake,
  Layers,
  Globe,
  TrendingUp,
  Warehouse,
  Link2,
  BarChart3,
  Target,
  Leaf,
  Shield,
  Radio,
  ShoppingCart,
  FileText,
  PackageCheck,
  Send,
  ClipboardCheck,
  Briefcase,
  CreditCard,
  HeadphonesIcon,
  UserPlus,
} from "lucide-react";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { HubSelector } from "@/components/admin/HubSelector";
import { UserMenu } from "@/components/admin/UserMenu";

// Super Admin Navigation
const superAdminNavigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Phase I: Hub Network",
    items: [
      { name: "Hubs", href: "/admin/hubs", icon: Building2 },
      { name: "Pincode Coverage", href: "/admin/pincodes", icon: MapPin },
    ],
  },
  {
    name: "Phase II: Fleet",
    items: [
      { name: "Vehicles", href: "/admin/vehicles", icon: Truck },
      { name: "Drivers", href: "/admin/drivers", icon: Users },
    ],
  },
  {
    name: "Phase III: Transport",
    items: [
      { name: "Routes", href: "/admin/routes", icon: Route },
      { name: "Trips", href: "/admin/trips", icon: Navigation },
    ],
  },
  {
    name: "Phase IV: Shipments",
    items: [
      { name: "All Shipments", href: "/admin/shipments", icon: Package },
      { name: "Consignments", href: "/admin/consignments", icon: Layers },
      { name: "Journey Plans", href: "/admin/journeys", icon: TrendingUp },
    ],
  },
  {
    name: "Orders & Fulfillment",
    items: [
      { name: "All Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Manifest", href: "/admin/orders/manifest", icon: FileText },
      { name: "Pick", href: "/admin/orders/pick", icon: PackageCheck },
      { name: "Pack", href: "/admin/orders/pack", icon: Box },
      { name: "Dispatch", href: "/admin/orders/dispatch", icon: Send },
      { name: "Delivery", href: "/admin/orders/delivery", icon: Truck },
      { name: "POD", href: "/admin/orders/pod", icon: ClipboardCheck },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Hub Scanning", href: "/admin/scanning", icon: ScanLine },
      { name: "Partner Handovers", href: "/admin/handovers", icon: Handshake },
      { name: "Partner Zones", href: "/admin/partner-zones", icon: Globe },
      { name: "Control Tower", href: "/control-tower", icon: Radio },
    ],
  },
  {
    name: "Scale & Analytics",
    items: [
      { name: "WMS", href: "/wms", icon: Warehouse },
      { name: "ERP Integrations", href: "/integrations", icon: Link2 },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Capacity Planning", href: "/capacity", icon: Target },
      { name: "Carbon Footprint", href: "/carbon", icon: Leaf },
      { name: "Insurance", href: "/insurance", icon: Shield },
    ],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

// B2B Client Admin Navigation
const b2bClientAdminNavigation = [
  {
    name: "Dashboard",
    href: "/admin/clients",
    icon: LayoutDashboard,
  },
  {
    name: "Client Management",
    items: [
      { name: "All Clients", href: "/admin/clients", icon: Briefcase },
      { name: "Add New Client", href: "/admin/clients/new", icon: UserPlus },
    ],
  },
  {
    name: "Orders",
    items: [
      { name: "All Client Orders", href: "/admin/clients/orders", icon: ShoppingCart },
      { name: "Pickup Requests", href: "/admin/clients/pickups", icon: Truck },
    ],
  },
  {
    name: "Billing",
    items: [
      { name: "Invoices", href: "/admin/clients/invoices", icon: FileText },
      { name: "COD Remittance", href: "/admin/clients/cod", icon: CreditCard },
    ],
  },
  {
    name: "Support",
    items: [
      { name: "Support Tickets", href: "/admin/clients/tickets", icon: HeadphonesIcon },
    ],
  },
  {
    name: "Settings",
    href: "/admin/clients/settings",
    icon: Settings,
  },
];

type PanelType = "super-admin" | "b2b-client-admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>("super-admin");
  const pathname = usePathname();

  // Auto-detect panel based on URL
  useEffect(() => {
    if (pathname?.startsWith("/admin/clients")) {
      setActivePanel("b2b-client-admin");
    } else if (pathname === "/admin" || pathname?.startsWith("/admin/")) {
      // Check if it's a super admin route
      const superAdminRoutes = ["/admin/hubs", "/admin/vehicles", "/admin/drivers", "/admin/routes", "/admin/trips", "/admin/shipments", "/admin/consignments", "/admin/journeys", "/admin/orders", "/admin/scanning", "/admin/handovers", "/admin/partner-zones", "/admin/pincodes", "/admin/settings"];
      const isSuperAdminRoute = pathname === "/admin" || superAdminRoutes.some(route => pathname?.startsWith(route));
      if (isSuperAdminRoute) {
        setActivePanel("super-admin");
      }
    }
  }, [pathname]);

  const navigation = activePanel === "super-admin" ? superAdminNavigation : b2bClientAdminNavigation;
  const panelTitle = activePanel === "super-admin" ? "Super Admin" : "B2B Client Admin";
  const homeHref = activePanel === "super-admin" ? "/admin" : "/admin/clients";

  return (
    <AdminAuthGuard>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Package className="h-7 w-7 text-primary-500" />
                <span className="font-bold text-lg">CJDarcl Quick</span>
              </div>
              <span className="text-xs text-gray-400 ml-9">Super Admin</span>
            </div>
          )}
          {collapsed && <Package className="h-8 w-8 text-primary-500 mx-auto" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    pathname === item.href
                      ? "bg-primary-600 text-white"
                      : "text-gray-300"
                  }`}
                >
                  {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              ) : (
                <div>
                  {!collapsed && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                      {item.name}
                    </div>
                  )}
                  {item.items?.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors ${
                        pathname === subItem.href
                          ? "bg-primary-600 text-white"
                          : "text-gray-300"
                      } ${!collapsed ? "pl-6" : ""}`}
                    >
                      <subItem.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{subItem.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          {!collapsed && (
            <div className="text-xs text-gray-500">
              <p>v1.0.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            {pathname !== homeHref && (
              <Link
                href={homeHref}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="font-medium">Home</span>
              </Link>
            )}
            {activePanel === "super-admin" && <HubSelector />}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View Site
            </Link>
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
    </AdminAuthGuard>
  );
}
