import Navbar from "@/components/navbar"
import BoardCard from "@/components/BoardCard"
import Link from "next/link"
import {Button} from "@/components/ui/button"


type ProfilePageProps = {
  image:string,
 
}

const ProfilePage = ({image}: ProfilePageProps) => {
  return (
    <div className="bg-grey-200 min-h-screen">
        <Navbar/>

    <div className= " mx-10 bg-white p-10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.15)] text-left gap-6">
      {/* container div */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <img src= "/image/account-circle.svg" width={200} height={200} alt="user-image"/>
            {/* texts */}
        <div className="ml-10">
            <h1 className="font-bold text-3xl">Jane Doe</h1>
            <h3 className="font-semibold">Student</h3>
            <h3 className="font-semibold">1st year</h3>
        </div>

        </div>
            {/* buttons */}
            <div className="">
            <Button>Friends</Button>

            </div>
      </div>
    </div>


 <div className="mx-4 sm:mx-10 lg:mx-20 my-10">

        {/* boards and search input section */}
        <section className="flex items-center justify-between">
      <h1 className="text-3xl font-600">My Sessions</h1>

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
              username=""  
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
             
        </div>
      

      </div>
      </div>

  )
}

export default ProfilePage