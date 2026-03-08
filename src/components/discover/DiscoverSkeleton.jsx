import React from "react";

export default function DiscoverSkeleton() {
  return (
    <div className="max-w-lg mx-auto p-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      </div>

      {/* Main Card Skeleton */}
      <div className="relative aspect-[3/4] rounded-[2.5rem] bg-gray-200 overflow-hidden mb-6">
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/20 to-transparent">
          <div className="h-8 w-48 bg-white/30 rounded-lg mb-2"></div>
          <div className="h-4 w-32 bg-white/20 rounded-md"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
        <div className="w-20 h-20 rounded-full bg-gray-200"></div>
        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
      </div>

      {/* Bio / Info Skeleton */}
      <div className="mt-8 space-y-4">
        <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded-md"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
