import Image from "next/image";

type CardProps = {
  heading: string,
  body: string,
  image: string
  alt: string

}


const Card = ({heading, body, image, alt} : CardProps) => {
  return (
    <div className="bg-white p-10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center text-left gap-6">
        <div className="w-full h-[250px] overflow-hidden rounded-lg flex items-center justify-center">
      <Image src={image} alt={alt} width={300} height={300} className="object-cover"/>


        </div>
     
      <h3 className="text-md font-bold">{heading}</h3>
      <p>{body}</p>
    </div>
  )

}

export default Card