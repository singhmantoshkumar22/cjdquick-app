"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Simple toast state management
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { id, ...options };
  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 5000);

  // Also log to console for debugging
  const prefix = options.variant === "destructive" ? "❌" : "✓";
  console.log(`${prefix} Toast: ${options.title || ""} - ${options.description || ""}`);
}

export function useToast() {
  const [_, setUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const listener = () => setUpdate((u) => u + 1);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    toast,
    toasts,
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    },
  };
}
