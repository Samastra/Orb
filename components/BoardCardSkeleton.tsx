const BoardCardSkeleton = () => {
  return (
    <div className="group p-4 bg-white border border-gray-100 rounded-xl w-full animate-pulse">
      
      {/* Header skeleton */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          {/* Public badge skeleton */}
          <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
        </div>

        {/* Category and date skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-10 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {/* User info skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-16 h-3 bg-gray-200 rounded"></div>
        </div>

        {/* Engagement metrics skeleton */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <div className="w-4 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <div className="w-4 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BoardCardSkeleton;