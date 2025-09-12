import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Card from "@/components/Card"
import Link from "next/link"
const App = () => {
  return (
    <main className="body">
        {/* this is the nav bar setion */}
      <section>
      <Navbar />
      </section>

        <div className="mx-30 my-20 mt-40 ">

        <h1 className="text-6xl font-semibold">Supercharge your brainstorming  session with <span className="text-purple-600">orb</span> </h1>

        <h3 className="my-5 text-2xl">Brainstorm your way through complex ideas, with AI to guide, clarify, and <br/> recommend what’s worth learning next.</h3>

          <div className="flex gap-4 items-center my-15">
          <Button className="px-6 py-6 text-lg">Join for Free</Button>
         <Link href="/[boardId]" as="/new">
         <Button className="px-6 py-6 text-lg">Start a Session</Button>
         </Link> 
          </div>
        </div>
        
       {/* next page */}
       <section className="mx-30 my-20 mt-50 grid md:grid-cols-3 gap-10">
            <div>
                <h2 className="text-xl font-semibold text-center my-20">Public Knowledge Hub</h2>
                <Card 
                body = "Share your brainstorming sessions with the community or explore boards created by others. From study notes to creative projects. Orb’s public hub makes learning and idea-sharing open, searchable, and inspiring."  
                heading="Ideas are better when shared" 
                image="/image/publicnotesboard.png"
                alt="a card displaying orb features on ideas"
                 />
            </div>

            <div>
                <h2 className="text-xl font-semibold text-center my-20">Public Knowledge Hub</h2>
                <Card 
                body = "Don’t get stuck searching the web. As you brainstorm, Orb recommends articles, videos, and books matched to your topic — keeping your focus sharp and your flow unbroken. " 
                heading="Knowledge comes to you, instantly." 
                image="/image/itchinghead.png" 
                alt="a card displaying orb features on ideas"/>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-center my-20">Public Knowledge Hub</h2>
                <Card 
                body = "Jump into a live session, revisit past boards, or browse suggested topics. Orb keeps your sessions organized and accessible, so your ideas and insights are always within reach." 
                heading="Your ideas, always within reach." 
                image="/image/holdingbulb.png"
                alt="a card displaying orb features on ideas"/>
            </div>

       </section>

    </main>
  )
}

export default App