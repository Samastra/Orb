import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ResourceCardProps = {
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  url?: string;
  type: 'book' | 'video' | 'photo' | 'vector' | 'website';
}

const ResourceCard = ({ heading, body, image, alt, url, type }: ResourceCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Get fallback image based on type
  const getFallbackImage = () => {
    switch (type) {
      case 'book':
        return '/book-placeholder.svg';
      case 'video':
        return '/video-placeholder.svg';
      case 'photo':
        return '/photo-placeholder.svg';
      case 'vector':
        return '/vector-placeholder.svg';
      case 'website':
        return '/website-placeholder.svg';
      default:
        return '/book-placeholder.svg';
    }
  };

  const displayImage = image && !imageError ? image : getFallbackImage();

  // IMAGE-ONLY LAYOUT for photos and vectors - NO TEXT AT ALL
  if (type === 'photo' || type === 'vector') {
    const cardContent = (
      <div className={`
        bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 
        border border-gray-100 hover:border-blue-200 overflow-hidden
        ${url ? 'cursor-pointer hover:scale-[1.02]' : ''}
      `}>
        {/* Pure image - no text, no badges, nothing */}
        <div className="w-full h-48 relative">
          <img
            src={displayImage}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      </div>
    );

    if (url) {
      return (
        <Link href={url} target="_blank" rel="noopener noreferrer">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  }

  // REGULAR LAYOUT for other types (books, videos, websites)
  const cardContent = (
    <div className={`
      bg-white p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
      hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 
      border border-gray-100 hover:border-blue-200 flex gap-3 h-24
      ${url ? 'cursor-pointer hover:scale-[1.02]' : ''}
    `}>
      {/* Image/Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden bg-gray-100">
        <img
          src={displayImage}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      
      {/* Content - keep for non-image types */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
          {heading}
        </h3>
        {body && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {body}
          </p>
        )}
        <div className="flex items-center mt-1">
          <span className={`
            text-xs px-1.5 py-0.5 rounded-full capitalize
            ${type === 'book' ? 'bg-blue-100 text-blue-700' : ''}
            ${type === 'video' ? 'bg-red-100 text-red-700' : ''}
            ${type === 'website' ? 'bg-purple-100 text-purple-700' : ''}
          `}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );

  if (url) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default ResourceCard;