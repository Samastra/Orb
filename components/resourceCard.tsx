import Image from "next/image";

type ResourceCardProps = {
  heading: string,
  body?: string,
  image?: string
  alt: string

}

const ResourceCard = ({heading, body, image, alt} : ResourceCardProps) => {

  return (
    <div className="bg-white p-2 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.10)] flex flex-col items-center text-left gap-2">
        <div className="w-full  overflow-hidden rounded-sm flex flex-col items-left justify-center">
  
      <h3 className="text-md font-bold">{heading}</h3>
      <p>{body}</p>

        </div>
    </div>
  )

}

export default ResourceCard