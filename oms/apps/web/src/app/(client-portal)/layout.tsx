"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/client", icon: LayoutDashboard },
  {
    name: "Sales",
    href: "/client/sales",
    icon: ShoppingCart,
    children: [
      { name: "Overview", href: "/client/sales" },
      { name: "Orders", href: "/client/sales/orders" },
      { name: "SKU Performance", href: "/client/sales/sku-performance" },
    ],
  },
  {
    name: "Fulfillment",
    href: "/client/fulfillment",
    icon: Truck,
    children: [
      { name: "Overview", href: "/client/fulfillment" },
      { name: "Shipments", href: "/client/fulfillment/shipments" },
      { name: "By Location", href: "/client/fulfillment/by-location" },
    ],
  },
  {
    name: "Inventory",
    href: "/client/inventory",
    icon: Package,
    children: [
      { name: "Overview", href: "/client/inventory" },
      { name: "Stock Levels", href: "/client/inventory/stock" },
      { name: "Inbound", href: "/client/inventory/inbound" },
    ],
  },
  {
    name: "Returns",
    href: "/client/returns",
    icon: RotateCcw,
    children: [
      { name: "Overview", href: "/client/returns" },
      { name: "RTO Analysis", href: "/client/returns/rto" },
    ],
  },
  {
    name: "Reports",
    href: "/client/reports",
    icon: FileText,
    children: [
      { name: "Sales Report", href: "/client/reports/sales" },
      { name: "Inventory Report", href: "/client/reports/inventory" },
      { name: "Fulfillment Report", href: "/client/reports/fulfillment" },
      { name: "Returns Report", href: "/client/reports/returns" },
    ],
  },
  { name: "Analytics", href: "/client/analytics", icon: BarChart3 },
];

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sales"]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/client");
    }
    // Redirect non-CLIENT users to the main dashboard
    if (status === "authenticated" && session?.user?.role !== "CLIENT") {
      router.push("/dashboard");
    }
  }, [status, router, session?.user?.role]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } hidden md:flex flex-col bg-slate-800 text-white transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">Client Portal</span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ${
                      !sidebarOpen && "justify-center"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span className="ml-3">{item.name}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedItems.includes(item.name) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  {sidebarOpen && expandedItems.includes(item.name) && (
                    <div className="pl-12 pb-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors ${
                    !sidebarOpen && "justify-center"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{session.user?.email}</p>
              </div>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="mx-auto block text-slate-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">Client Portal</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, SKUs..."
                className="pl-10 pr-4 py-2 w-64 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Date range selector */}
            <select className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Custom Range</option>
            </select>
            <button className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link
              href="/client/settings"
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
