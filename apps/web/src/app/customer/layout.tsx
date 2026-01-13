"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Truck, Building2, ShoppingCart, Boxes } from "lucide-react";
import { ServiceContext, type ServiceType } from "./service-context";

const services = [
  {
    id: "b2b" as ServiceType,
    label: "CJDQuick B2B",
    icon: Building2,
    color: "blue",
  },
  {
    id: "b2c" as ServiceType,
    label: "CJDQuick B2C",
    icon: ShoppingCart,
    color: "green",
  },
  {
    id: "oms" as ServiceType,
    label: "CJDQuick OMS",
    icon: Boxes,
    color: "purple",
  },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceType>("b2b");

  useEffect(() => {
    // Check if on OMS pages
    if (pathname.startsWith("/customer/oms")) {
      setSelectedService("oms");
      localStorage.setItem("selected_service", "oms");
      return;
    }

    // Load saved service preference
    const saved = localStorage.getItem("selected_service") as ServiceType;
    if (saved && ["b2b", "b2c", "oms"].includes(saved)) {
      setSelectedService(saved);
      // If OMS was saved but we're not on OMS page, redirect
      if (saved === "oms" && !pathname.startsWith("/customer/oms")) {
        router.push("/customer/oms/dashboard");
      }
    }
  }, [pathname, router]);

  const handleServiceChange = (service: ServiceType) => {
    setSelectedService(service);
    localStorage.setItem("selected_service", service);

    // Navigate to appropriate dashboard
    if (service === "oms") {
      router.push("/customer/oms/dashboard");
    } else if (pathname.startsWith("/customer/oms")) {
      // If leaving OMS, go back to main dashboard
      router.push("/customer/dashboard");
    }
  };

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/customer/login") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/customer/login");
      return;
    }

    // Verify token and get customer data
    fetch("/api/customer/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLoading(false);
        } else {
          localStorage.removeItem("customer_token");
          router.push("/customer/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("customer_token");
        router.push("/customer/login");
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  // Show only children for login page
  if (pathname === "/customer/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ServiceContext.Provider value={{ selectedService, setSelectedService: handleServiceChange }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Row - Logo */}
            <div className="flex justify-center items-center h-16 border-b border-gray-100">
              <Link href="/customer/dashboard" className="flex items-center gap-3">
                <Truck className="h-10 w-10 text-blue-600" />
                <span className="font-bold text-2xl text-gray-900">CJDarcl Quick</span>
              </Link>
            </div>

            {/* Service Tabs */}
            <div className="flex justify-center items-center py-3">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isActive = selectedService === service.id;

                  const colorClasses = {
                    blue: isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200",
                    green: isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200",
                    purple: isActive
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200",
                  };

                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                        colorClasses[service.color as keyof typeof colorClasses]
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {service.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={pathname.startsWith("/customer/oms") ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
          {children}
        </main>
      </div>
    </ServiceContext.Provider>
  );
}
