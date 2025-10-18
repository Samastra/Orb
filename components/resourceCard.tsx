import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Book, Video, ImageIcon, Globe, LayoutTemplate, ExternalLink } from "lucide-react";

type ResourceCardProps = {
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  url?: string;
  type: 'book' | 'video' | 'photo' | 'vector' | 'website';
  onAddToBoard?: (imageUrl: string, altText: string) => void;
  onPlayVideo?: (videoId: string, title: string) => void; // ← ADD THIS
}

const ResourceCard = ({ heading, body, image, alt, url, type, onAddToBoard, onPlayVideo }: ResourceCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Handle click - prioritize adding to board over navigation
 const handleClick = (e: React.MouseEvent) => {
  // If it's an image type and we have the add handler, use that instead of navigation
  if ((type === 'photo' || type === 'vector') && image && onAddToBoard) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Adding image to board:', image);
    onAddToBoard(image, alt);
    return;
  }

    const extractYouTubeId = (url: string): string | null => {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    };

  // NEW: If it's a video and we have the video handler, use modal instead of navigation
  if (type === 'video' && onPlayVideo && url) {
    e.preventDefault();
    e.stopPropagation();
    
    // Extract YouTube video ID from URL
    const videoId = extractYouTubeId(url);
    if (videoId) {
      console.log('🎬 Playing video in modal:', videoId);
      onPlayVideo(videoId, heading);
    }
    return;
  }
  
  // For other types or if no handler, allow normal navigation
  if (!url) {
    e.preventDefault();
  }
};

  // Get icon based on resource type
  const getTypeIcon = () => {
    switch (type) {
      case 'book':
        return <Book className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'photo':
      case 'vector':
        return <ImageIcon className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  };

  // Get type color scheme
  const getTypeStyles = () => {
    switch (type) {
      case 'book':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          gradient: 'from-blue-100 to-blue-200'
        };
      case 'video':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700', 
          border: 'border-red-200',
          gradient: 'from-red-100 to-red-200'
        };
      case 'photo':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          gradient: 'from-green-100 to-green-200'
        };
      case 'vector':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          gradient: 'from-purple-100 to-purple-200'
        };
      case 'website':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          gradient: 'from-orange-100 to-orange-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          gradient: 'from-gray-100 to-gray-200'
        };
    }
  };

  // Get fallback image based on type
  const getFallbackImage = () => {
    const styles = getTypeStyles();
    return (
      <div className={`w-full h-full bg-gradient-to-br ${styles.gradient} flex items-center justify-center rounded-lg`}>
        {getTypeIcon()}
      </div>
    );
  };

  const displayImage = image && !imageError ? image : null;

  // IMAGE-ONLY LAYOUT for photos and vectors - PREMIUM STYLING
  if (type === 'photo' || type === 'vector') {
    const cardContent = (
      <div 
        className={`
          group relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg
          hover:shadow-2xl transition-all duration-300 border border-gray-200/80
          hover:border-blue-300 overflow-hidden
          ${(url || onAddToBoard) ? 'cursor-pointer hover:scale-[1.02]' : ''}
        `}
        onClick={handleClick}
      >
        {/* Premium Image Container */}
        <div className="w-full h-48 relative overflow-hidden">
          {displayImage ? (
            <img
              src={displayImage}
              alt={alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            getFallbackImage()
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
          
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className={`
              text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium
              ${getTypeStyles().text} ${getTypeStyles().bg} border ${getTypeStyles().border}
              flex items-center gap-1
            `}>
              {getTypeIcon()}
              {type}
            </span>
          </div>
          
          {/* Add to board indicator for images */}
          {onAddToBoard && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-blue-600 text-white p-1.5 rounded-full backdrop-blur-sm">
                <span className="text-xs font-medium">+ Add</span>
              </div>
            </div>
          )}
          
          {/* External link indicator for non-images */}
          {url && type !== 'photo' && type !== 'vector' && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm">
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>
        
        {/* Minimal title for image cards */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 text-center group-hover:text-blue-600 transition-colors duration-300">
            {heading}
          </h3>
        </div>
      </div>
    );

    // For images, we don't use Link since we handle clicks manually
    return cardContent;
  }

  // PREMIUM LAYOUT for other types (books, videos, websites)
  const cardContent = (
    <div 
      className={`
        group bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg
        hover:shadow-2xl transition-all duration-300 border border-gray-200/80
        hover:border-blue-300 flex gap-4
        ${url ? 'cursor-pointer hover:scale-[1.02]' : ''}
      `}
      onClick={handleClick}
    >
      {/* Premium Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 relative">
        {displayImage ? (
          <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200/80">
            <img
              src={displayImage}
              alt={alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getTypeStyles().gradient} flex items-center justify-center border ${getTypeStyles().border}`}>
            {getTypeIcon()}
          </div>
        )}
      </div>
      
      {/* Premium Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {heading}
          </h3>
          {url && (
            <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 mt-0.5" />
          )}
        </div>
        
        {body && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {body}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className={`
            text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm
            ${getTypeStyles().text} ${getTypeStyles().bg} border ${getTypeStyles().border}
            flex items-center gap-1
          `}>
            {getTypeIcon()}
            {type}
          </span>
          
          {/* Preview indicator for URLs */}
          {url && (
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to open
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // For non-image types with URLs, use Link for proper navigation
        if (url && type !== 'video') {
        return (
          <Link href={url} target="_blank" rel="noopener noreferrer" className="block">
            {cardContent}
          </Link>
        );
      }

  return cardContent;
};

export default ResourceCard;