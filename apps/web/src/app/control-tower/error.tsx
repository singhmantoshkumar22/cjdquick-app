"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@cjdquick/ui";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ControlTowerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Control Tower Error:", error);
  }, [error]);

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Control Tower Error
        </h2>

        <p className="text-gray-600 mb-6">
          Something went wrong while loading the Control Tower dashboard.
          This could be due to a network issue or temporary service disruption.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Troubleshooting Tips:
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Clear your browser cache and refresh</li>
            <li>• Try again in a few minutes</li>
            <li>• Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
