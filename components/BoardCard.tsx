type BoardCardProps = {
  title: string,
  username: string,
  boardcategory: string,
  upvotes: number,
  saves: number,
}


const  BoardCard = ({ title, username, boardcategory, upvotes, saves }: BoardCardProps) => {
  return (
    <div className = " mt-3  p-4 bg-white shadow-[0_0_30px_rgba(0,0,0,0.10)]  rounded-lg">

      <div className="flex items-center justify-between gap-4"> 
        <h2 className="text-md font-bold">{title}</h2>
        <div  className="flex items-center justify-between gap-1">
        <p className="text-sm font-bold flex gap-2">by {username}</p>
        <p>{upvotes}</p>
        <img src="/image/star.svg" alt="upvoteStar" />
        </div>

      </div>
    {/* bottom board card-text */}
    <div className="flex items-center justify-between gap-4">
         <h3>{boardcategory}</h3>

        <div className="flex items-center justify-between gap-1">
          {saves}
          <img src ="/image/bookmark.svg"  alt = "save-icon" />
        </div>


    </div>


    </div>
  )
}

export default BoardCard 