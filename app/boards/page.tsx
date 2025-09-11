import Link from "next/link"
import BoardCard from "@/components/BoardCard"

const PublicBoards = () => {
  return (
    <div className="min-h-screen bg-gray-200">

      {/* header menu */}
      <nav className="flex items-center justify-between p-4 bg-white ">
        <div className="flex items-center justify-between ">
          <img src="/image/ham-menu.svg" alt="menu" className="w-12 h-12" />

          <Link href="/" className="text-2xl font-bold mr-10 ml-10">Orb</Link>
        </div>
        <div >
          <Link href="/profilePage">
            <img src="/image/account-circle.svg" alt="account" className="w-12 h-12" />
          </Link>
        </div>
      </nav>
      {/* side bar */}
          <div className="flex gap-4">
            {/* ... */}
          </div>
      {/* main render public boards */}

      <div className="mx-4 sm:mx-10 lg:mx-20 my-10">

        {/* boards and search input section */}
        <section className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Public Boards</h1>

      <div className=" flex items-center justify-between gap-1" >
        <img src="/image/sort.svg" alt="filter-icon" />
        <h3>Filter</h3>

        <input 
        type="text"

        placeholder="Search boards"
        className="border border-gray-300 rounded-lg px-4 py-2 ml-5"        
        />
      </div>

        </section>

            {/* public board results */}
        <div className=" mt-10 overflow-scroll bg-white p-5 rounded-lg">
              <BoardCard
              title="Crash course :History of the Roman empire."
              username="@bennySam"
              boardcategory="Study"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Finding the Perfect Hook for My Novel"
              username="@wordsmith"
              boardcategory="Writing · Creativity"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Mind Mapping My 2025 Goals"
              username="@focusdaily"
              boardcategory="Personal · Productivity "
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="What If Cities Ran on 100% Renewable Energy?"
              username="@bigthinker"
              boardcategory="Curiosity · Future"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
              <BoardCard
              title="Breaking Down Quantum Physics in Plain English"
              username="@studentgenius"
              boardcategory="Study · Physics"
              upvotes={120}
              saves={30}
              
              />
        </div>
      

      </div>
      </div>
  )
}

export default PublicBoards