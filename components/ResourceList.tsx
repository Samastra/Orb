import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResourceCard from "./resourceCard"


const ResourceList = () => {
  return (
    <Tabs defaultValue="books" className=" mx-3">
      <div className="mx-1">
      <TabsList>
        <TabsTrigger value="books">Books</TabsTrigger>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        <TabsTrigger value="websites">Websites</TabsTrigger>
        <TabsTrigger value="boards">Boards</TabsTrigger>
      </TabsList>
      <div className="border border-gray-300 rounded-lg p-1 mt-4 mx-auto h-96 overflow-y-auto">
      <TabsContent value="books">

        <ResourceCard heading="Book Title" body="Book Description"  alt="Book Image" />

      </TabsContent>
      <TabsContent value="videos">
        <ResourceCard heading="Video Title" body="Video Description"  alt="Video Image" />

      </TabsContent>
      <TabsContent value="websites">
        <ResourceCard heading="Website Title" body="Website Description"  alt="Website Image" />

      </TabsContent>
      <TabsContent value="boards">
        <ResourceCard heading="Board Title" body="Board Description"  alt="Board Image" />

      </TabsContent>

      </div>

      </div>
    </Tabs>
  )
}

export default ResourceList