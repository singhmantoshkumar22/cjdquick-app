"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Home,
  ShoppingCart,
  Truck,
  AlertTriangle,
  DollarSign,
  FileText,
  HeadphonesIcon,
  Settings,
  Calculator,
  MapPin,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Menu,
  Boxes,
  RotateCcw,
  Building2,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@cjdquick/ui";

interface ServiceType {
  id: string;
  type: "B2B" | "B2C" | "DASHBOARDS";
  name: string;
  description: string;
}

interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  serviceModel?: string; // SHIPPING | FULFILLMENT | HYBRID
}

const navigation = [
  { name: "Dashboard", href: "/portal", icon: Home },
  { name: "Orders", href: "/portal/orders", icon: ShoppingCart },
  { name: "Reverse Orders", href: "/portal/reverse-orders", icon: RotateCcw },
  { name: "Pickups", href: "/portal/pickups", icon: Truck },
  { name: "Exceptions & NDR", href: "/portal/exceptions", icon: AlertTriangle },
  { name: "Finances", href: "/portal/finances", icon: DollarSign, children: [
    { name: "Remittances", href: "/portal/finances/remittances" },
    { name: "Invoices", href: "/portal/finances/invoices" },
    { name: "Claims", href: "/portal/finances/claims" },
  ]},
  { name: "Support", href: "/portal/support", icon: HeadphonesIcon },
  { name: "Reports", href: "/portal/reports", icon: FileText },
];

const infoLinks = [
  { name: "Rate Calculator", href: "/portal/info/rate-calculator", icon: Calculator },
  { name: "Serviceability", href: "/portal/info/serviceability", icon: MapPin },
];

// All service types - B2B, B2C, and WMS
const ALL_SERVICE_OPTIONS: ServiceType[] = [
  {
    id: "B2B",
    type: "B2B",
    name: "CJD Quick B2B",
    description: "Business to Business Shipping",
  },
  {
    id: "B2C",
    type: "B2C",
    name: "CJD Quick B2C",
    description: "Business to Consumer Shipping",
  },
  {
    id: "DASHBOARDS",
    type: "DASHBOARDS",
    name: "CJDQuick OMS",
    description: "Order Management Service",
  },
];

// Helper to get available services - all brands get access to all services
const getAvailableServices = (): ServiceType[] => {
  // All brands get access to B2B, B2C, and WMS
  // WMS/OMS shows brand-specific data for each logged-in client
  return ALL_SERVICE_OPTIONS;
};

// Note: CJDQuick OMS runs as a separate service on port 3001
// When user clicks OMS button, it opens http://localhost:3001/client in new tab

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedService, setSelectedService] = useState<ServiceType>(ALL_SERVICE_OPTIONS[0]);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get available services - all brands get access to all options
  const availableServices = getAvailableServices();

  // Skip layout for login page
  if (pathname === "/portal/login" || pathname === "/portal/register") {
    return <>{children}</>;
  }

  useEffect(() => {
    const token = localStorage.getItem("portal_token");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    const storedUser = localStorage.getItem("portal_user");
    const storedServiceType = localStorage.getItem("portal_service_type");

    let parsedUser: PortalUser | null = null;
    if (storedUser) {
      parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }

    // Get available services - all brands get access to all options
    const userAvailableServices = getAvailableServices();

    if (storedServiceType) {
      // Only select the stored service if it's available for this user
      const service = userAvailableServices.find((s) => s.id === storedServiceType);
      if (service) {
        setSelectedService(service);
      } else {
        // Fallback to first available service if stored one is not available
        setSelectedService(userAvailableServices[0]);
      }
    }
  }, [router, pathname]);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    localStorage.setItem("portal_service_type", service.id);
    setShowServiceDropdown(false);

    // Navigate to appropriate landing page based on service type
    if (service.type === "DASHBOARDS") {
      // CJDQuick OMS runs as separate service on port 3001
      // Opens OMS Client Portal in new tab
      window.open("http://localhost:3001/client", "_blank");
    } else {
      // Refresh to load data for selected service type
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_brands");
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_service_type");
    router.push("/portal/login");
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "B2B": return Building2;
      case "B2C": return Boxes;
      case "DASHBOARDS": return LayoutDashboard;
      default: return Building2;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case "B2B": return "text-purple-600 bg-purple-100";
      case "B2C": return "text-blue-600 bg-blue-100";
      case "DASHBOARDS": return "text-green-600 bg-green-100";
      default: return "text-purple-600 bg-purple-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Logo & Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/portal" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 hidden sm:inline">
                CJDarcl Quick
              </span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search AWB, Order ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: Actions & Brand Selector */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              Quick Actions
            </Button>

            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Service Selector Dropdown - B2B / B2C */}
            <div className="relative">
              <button
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 min-w-[180px]"
              >
                {(() => {
                  const Icon = getServiceIcon(selectedService.type);
                  return (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getServiceColor(selectedService.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })()}
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {selectedService.name}
                  </div>
                  <div className="text-xs text-gray-500">{selectedService.description}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Service Dropdown - Only B2B and B2C */}
              {showServiceDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Select Service</p>
                  </div>
                  <div className="py-2">
                    {availableServices.map((service) => {
                      const Icon = getServiceIcon(service.type);
                      const isSelected = selectedService.id === service.id;
                      return (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getServiceColor(service.type)}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {service.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {service.description}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || "U"}
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  <Link
                    href="/portal/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/portal/settings/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-60 bg-slate-900 text-white transition-transform z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {/* B2B/B2C Navigation - OMS opens in separate tab */}
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </div>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-700">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
              Tools
            </div>
            {infoLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700">
            <Link
              href="/portal/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 ${sidebarOpen ? "lg:pl-60" : ""} min-h-screen`}>
        <div className="p-6">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
