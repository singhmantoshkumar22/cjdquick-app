"use client";

import { createContext, useContext } from "react";

export type ServiceType = "b2b" | "b2c" | "oms";

export interface ServiceContextType {
  selectedService: ServiceType;
  setSelectedService: (service: ServiceType) => void;
}

export const ServiceContext = createContext<ServiceContextType | null>(null);

export function useService() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useService must be used within CustomerLayout");
  }
  return context;
}
