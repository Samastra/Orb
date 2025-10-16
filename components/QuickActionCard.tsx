import Link from "next/link"

interface QuickActionCardProps {
  icon: string
  title: string
  description: string
  href?: string
  onClick?: () => void
  color?: string
  variant?: "default" | "outline"
}

const QuickActionCard = ({
  icon,
  title,
  description,
  href,
  onClick,
  color = "bg-blue-50 border-blue-200 text-blue-700",
  variant = "default"
}: QuickActionCardProps) => {
  
  const cardContent = (
    <div className={`
      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
      ${variant === "outline" 
        ? "border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50" 
        : `${color} hover:scale-105 hover:shadow-md`
      }
    `}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          variant === "outline" ? "bg-blue-100" : "bg-white/80"
        }`}>
          <img src={icon} alt={title} className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs opacity-70 leading-tight">{description}</p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }

  return (
    <div onClick={onClick}>
      {cardContent}
    </div>
  )
}

export default QuickActionCard