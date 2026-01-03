import { Activity } from "lucide-react";

export default function ControlTowerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-12 bg-gray-200 rounded" />
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Center Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-gray-200 rounded" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-[420px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-400">Loading map...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-5 border-b">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="flex-1" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
