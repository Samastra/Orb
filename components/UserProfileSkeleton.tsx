const UserProfileSkeleton = () => {
  return (
    <div className="py-10 px-6 bg-white/90 rounded-3xl text-left gap-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            {/* Avatar Skeleton */}
            <div className="w-24 h-24 rounded-full bg-gray-200"></div>
          </div>
          <div className="ml-4 space-y-2">
            {/* Name Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            {/* Username Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            {/* Email Skeleton */}
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
        <div className="flex flex-col items-left gap-3 justify-center">
          {/* Buttons Skeleton */}
          <div className="h-9 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSkeleton;