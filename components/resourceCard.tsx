import { useState } from "react";
import { Book, Video, ImageIcon, Globe, ExternalLink, Plus } from "lucide-react";

type ResourceCardProps = {
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  url?: string;
  type: "book" | "video" | "photo" | "vector" | "website";
  onAddToBoard?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void;
  onOpenWebsite?: (url: string, title: string) => void;
};

const ResourceCard = ({ heading, body, image, alt, url, type, onAddToBoard, onPlayVideo, onOpenWebsite }: ResourceCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((type === "photo" || type === "vector") && image && onAddToBoard) return onAddToBoard(image, alt);
    if (type === "video" && onPlayVideo && url) {
      // (Simple extract ID logic)
      const videoId = url.split('v=')[1]?.split('&')[0]; 
      if (videoId) onPlayVideo(videoId, heading);
      return;
    }
    if (type === "website" && onOpenWebsite && url) return onOpenWebsite(url, heading);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const Icon = type === 'video' ? Video : type === 'website' ? Globe : type === 'book' ? Book : ImageIcon;

  // VISUALS: Minimalist "Studio" Style
  return (
    <div 
      onClick={handleClick}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image Preview (if available) */}
      {(image && !imageError) ? (
        <div className="relative h-32 w-full overflow-hidden bg-gray-100">
          <img src={image} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImageError(true)} />
          <div className="absolute top-2 left-2 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm">
            <Icon className="w-3 h-3" />
          </div>
          {onAddToBoard && (type === 'photo' || type === 'vector') && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <Plus className="w-3 h-3" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-2 w-full bg-gray-50 border-b border-gray-100" /> 
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{heading}</h4>
          {url && <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" />}
        </div>
        {body && type === 'website' && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{body}</p>
        )}
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">
            {type}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;