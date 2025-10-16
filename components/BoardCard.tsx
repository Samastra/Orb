import Link from "next/link"

type BoardCardProps = {
  title?: string;
  username?: string;
  boardcategory?: string;
  upvotes?: number;
  saves?: number;
  boardId?: string;
  // Add these for enhanced grid layout
  createdAt?: string;
  isPublic?: boolean;
};

const BoardCard = ({ 
  title, 
  username, 
  boardcategory, 
  upvotes = 0, 
  saves = 0, 
  boardId,
  createdAt,
  isPublic = false 
}: BoardCardProps) => {
  
  // Format date if provided
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const cardContent = (
    <div className="group p-4 bg-white border border-gray-100 rounded-xl w-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-100 hover:scale-[1.02]">
      
      {/* Header with title and metadata */}
      <div className="flex flex-col gap-3">
        {/* Title and quick actions */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold line-clamp-2 flex-1 leading-tight group-hover:text-blue-600 transition-colors">
            {title || "Untitled Board"}
          </h2>
          
          {/* Quick stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPublic && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Public
              </span>
            )}
          </div>
        </div>

        {/* Category and date */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {boardcategory || "General"}
          </span>
          {createdAt && (
            <span className="text-xs text-gray-500">
              {formatDate(createdAt)}
            </span>
          )}
        </div>
      </div>

      {/* Footer with user and engagement */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-xs text-gray-600 truncate max-w-20">
            {username || "User"}
          </span>
        </div>

        {/* Engagement metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <img 
              src="/image/star.svg" 
              alt="upvotes" 
              className="w-3 h-3 opacity-60"
            />
            <span className="text-xs text-gray-500">{upvotes}</span>
          </div>
          <div className="flex items-center gap-1">
            <img 
              src="/image/bookmark.svg" 
              alt="saves" 
              className="w-3 h-3 opacity-60"
            />
            <span className="text-xs text-gray-500">{saves}</span>
          </div>
        </div>
      </div>

    </div>
  );

  if (boardId) {
    return (
      <Link href={`/boards/${boardId}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default BoardCard;