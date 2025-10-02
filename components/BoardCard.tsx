import Link from "next/link"

type BoardCardProps = {
  title?: string;
  username?: string;
  boardcategory?: string;
  upvotes?: number;
  saves?: number;
  boardId?: string; // Add this for navigation
};

const BoardCard = ({ title, username, boardcategory, upvotes, saves, boardId }: BoardCardProps) => {
  const cardContent = (
    <div className="mt-3 p-4 bg-white shadow-[0_0_30px_rgba(0,0,0,0.10)] rounded-md w-full max-w-md mx-auto md:max-w-full cursor-pointer hover:shadow-[0_0_30px_rgba(0,0,0,0.15)] transition-shadow">
      
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"> 
        <h2 className="text-sm sm:text-md font-bold line-clamp-2 flex-1 min-w-0">
          {title}
        </h2>
        <div className="flex items-center justify-end sm:justify-between gap-2 sm:gap-1 flex-shrink-0">
          <p className="text-xs sm:text-sm font-bold flex gap-1 sm:gap-2 whitespace-nowrap">
            by {username}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm">{upvotes}</span>
            <img 
              src="/image/star.svg" 
              alt="upvoteStar" 
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 mt-3">
        <h3 className="text-xs sm:text-sm text-gray-600 truncate flex-1 min-w-0">
          {boardcategory}
        </h3>

        <div className="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
          <span className="text-xs sm:text-sm">{saves}</span>
          <img 
            src="/image/bookmark.svg" 
            alt="save-icon" 
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
        </div>
      </div>

    </div>
  );

  // If boardId is provided, wrap with Link for navigation
  if (boardId) {
    return (
      <Link href={`/boards/${boardId}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default BoardCard;