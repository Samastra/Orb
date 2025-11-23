// app/api/recommendations/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Add CORS headers helper
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

export async function GET(request: NextRequest) {
  console.log('🔍 Search route called!');
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const category = searchParams.get('category');
  const refresh = searchParams.get('refresh');
  const refreshCount = searchParams.get('refreshCount');

  console.log('📝 Query params:', { query, category, refresh, refreshCount });

  if (!query) {
    console.log('❌ No query provided');
    return addCorsHeaders(NextResponse.json({ error: 'Query is required' }, { status: 400 }));
  }

  try {
    // Enhanced query with variations for refresh
    let enhancedQuery = category ? `${query} ${category} learning` : `${query} tutorial education`;
    
    if (refresh === 'true') {
      const variations = [
        'creative', 'inspiration', 'ideas', 'concept', 'design',
        'art', 'visual', 'graphic', 'modern', 'trending'
      ];
      
      const variationIndex = parseInt(refreshCount || '0') % variations.length;
      enhancedQuery = `${query} ${variations[variationIndex]} ${category ? `${category} learning` : 'tutorial education'}`;
    }

    console.log('🎯 Enhanced query:', enhancedQuery);

    // Use relative URLs for internal API calls
    const baseUrl = request.nextUrl.origin;
    console.log('🌐 Base URL:', baseUrl);

    const urls = [
      `${baseUrl}/api/recommendations/books?query=${encodeURIComponent(enhancedQuery)}`,
      `${baseUrl}/api/recommendations/videos?query=${encodeURIComponent(enhancedQuery)}`,
      `${baseUrl}/api/recommignations/images?query=${encodeURIComponent(enhancedQuery)}`,
      `${baseUrl}/api/recommendations/websites?query=${encodeURIComponent(enhancedQuery)}`,
    ];

    console.log('📡 Fetching from URLs:', urls);

    const [booksResponse, videosResponse, imagesResponse, websitesResponse] = await Promise.allSettled([
      fetch(urls[0]),
      fetch(urls[1]),
      fetch(urls[2]),
      fetch(urls[3]),
    ]);

    // Process responses with better error handling
    const processResponse = async (response: PromiseSettledResult<Response>, type: string) => {
      if (response.status === 'fulfilled') {
        if (response.value.ok) {
          try {
            const data = await response.value.json();
            console.log(`✅ ${type} success:`, Array.isArray(data) ? data.length : 'invalid', 'items');
            return Array.isArray(data) ? data : [];
          } catch (parseError) {
            console.error(`❌ ${type} JSON parse error:`, parseError);
            return [];
          }
        } else {
          console.error(`❌ ${type} HTTP error:`, response.value.status, response.value.statusText);
          return [];
        }
      } else {
        console.error(`❌ ${type} promise rejected:`, response.reason);
        return [];
      }
    };

    const [books, videos, images, websites] = await Promise.all([
      processResponse(booksResponse, 'Books'),
      processResponse(videosResponse, 'Videos'),
      processResponse(imagesResponse, 'Images'),
      processResponse(websitesResponse, 'Websites'),
    ]);

    console.log(`📊 Final results: ${books.length} books, ${videos.length} videos, ${images.length} images, ${websites.length} websites`);

    const responseData = {
      query: enhancedQuery,
      books,
      videos, 
      images,
      websites,
      timestamp: new Date().toISOString(),
      refreshed: refresh === 'true'
    };

    return addCorsHeaders(NextResponse.json(responseData));

  } catch (error) {
    console.error('💥 Search orchestration error:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: 'Failed to fetch recommendations',
      books: [],
      videos: [],
      images: [],
      websites: []
    }, { status: 500 }));
  }
}

// Also handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}