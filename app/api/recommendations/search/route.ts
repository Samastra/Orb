import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const category = searchParams.get('category');
  const refresh = searchParams.get('refresh');
  const refreshCount = searchParams.get('refreshCount');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // Enhanced query with variations for refresh
    let enhancedQuery = category ? `${query} ${category} learning` : `${query} tutorial education`;
    
    // If refresh, add variations to get different results
    if (refresh === 'true') {
      const variations = [
        'creative', 'inspiration', 'ideas', 'concept', 'design',
        'art', 'visual', 'graphic', 'modern', 'trending'
      ];
      
      // Use refreshCount to cycle through variations
      const variationIndex = parseInt(refreshCount || '0') % variations.length;
      enhancedQuery = `${query} ${variations[variationIndex]} ${category ? `${category} learning` : 'tutorial education'}`;
    }

    // Fetch from all APIs in parallel
    const [booksResponse, videosResponse, imagesResponse, websitesResponse] = await Promise.allSettled([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/books?query=${encodeURIComponent(enhancedQuery)}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/videos?query=${encodeURIComponent(enhancedQuery)}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/images?query=${encodeURIComponent(enhancedQuery)}`),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/websites?query=${encodeURIComponent(enhancedQuery)}`),
    ]);

    // Process responses
    const books = booksResponse.status === 'fulfilled' ? await booksResponse.value.json() : [];
    const videos = videosResponse.status === 'fulfilled' ? await videosResponse.value.json() : [];
    const images = imagesResponse.status === 'fulfilled' ? await imagesResponse.value.json() : [];
    const websites = websitesResponse.status === 'fulfilled' ? await websitesResponse.value.json() : [];

    return NextResponse.json({
      query: enhancedQuery,
      books: Array.isArray(books) ? books : [],
      videos: Array.isArray(videos) ? videos : [],
      images: Array.isArray(images) ? images : [],
      websites: Array.isArray(websites) ? websites : [],
      timestamp: new Date().toISOString(),
      refreshed: refresh === 'true'
    });
  } catch (error) {
    console.error('Search orchestration error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch recommendations',
      books: [],
      videos: [],
      images: [],
      websites: []
    }, { status: 500 });
  }
}