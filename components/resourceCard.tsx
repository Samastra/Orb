import Image from "next/image";
import Link from "next/link";

type ResourceCardProps = {
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  url?: string;
  type: 'book' | 'video' | 'image' | 'website';
}

const ResourceCard = ({ heading, body, image, alt, url, type }: ResourceCardProps) => {
  // Truncate long text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Limit authors to 2 maximum
  const formatAuthors = (authors: string) => {
    if (!authors) return '';
    const authorList = authors.split(',');
    if (authorList.length > 2) {
      return authorList.slice(0, 2).join(', ') + ' et al.';
    }
    return authors;
  };

  const formattedBody = type === 'book' ? formatAuthors(body || '') : body;

  // Card content
  const cardContent = (
    <div className={`
      bg-white p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] 
      hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 
      border border-gray-100 hover:border-blue-200 flex gap-3 h-24
      ${url ? 'cursor-pointer hover:scale-[1.02]' : ''}
    `}>
      {/* Image/Thumbnail */}
      {/* // Replace the Image component with regular img tag */}
        {image && (
          <div className="flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden">
            <img
              src={image}
              alt={alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = getFallbackImage(type);
              }}
            />
          </div>
        )}
      
      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">
          {truncateText(heading, 60)}
        </h3>
        {formattedBody && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {truncateText(formattedBody, 80)}
          </p>
        )}
        <div className="flex items-center mt-1">
          <span className={`
            text-xs px-1.5 py-0.5 rounded-full capitalize
            ${type === 'book' ? 'bg-blue-100 text-blue-700' : ''}
            ${type === 'video' ? 'bg-red-100 text-red-700' : ''}
            ${type === 'image' ? 'bg-green-100 text-green-700' : ''}
            ${type === 'website' ? 'bg-purple-100 text-purple-700' : ''}
          `}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );

  // Wrap with link if URL exists
  if (url) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

// Fallback images for different types
const getFallbackImage = (type: String) => {
  switch (type) {
    case 'book':
      return '/book-placeholder.svg';
    case 'video':
      return '/video-placeholder.svg';
    case 'image':
      return '/image-placeholder.svg';
    case 'website':
      return '/website-placeholder.svg';
    default:
      return '/book-placeholder.svg';
  }
};

export default ResourceCard;