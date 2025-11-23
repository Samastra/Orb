// app/api/recommendations/search/route.ts - PRODUCTION DEBUG
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('🚀 PRODUCTION: Search route called');
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const baseUrl = request.nextUrl.origin;
    console.log('🌐 PRODUCTION: Base URL:', baseUrl);
    
    const urls = [
      `${baseUrl}/api/recommendations/books?query=${encodeURIComponent(query)}`,
      `${baseUrl}/api/recommendations/videos?query=${encodeURIComponent(query)}`,
      `${baseUrl}/api/recommendations/images?query=${encodeURIComponent(query)}`,
      `${baseUrl}/api/recommendations/websites?query=${encodeURIComponent(query)}`,
    ];

    console.log('📡 PRODUCTION: Making parallel API calls...');

    // PRODUCTION FIX: Call APIs sequentially instead of parallel
    console.log('🔄 PRODUCTION: Calling APIs sequentially...');
    
    const booksResponse = await fetch(urls[0]);
    console.log('📚 PRODUCTION: Books status:', booksResponse.status, booksResponse.ok);
    const books = booksResponse.ok ? await booksResponse.json() : [];
    
    const videosResponse = await fetch(urls[1]);
    console.log('🎬 PRODUCTION: Videos status:', videosResponse.status, videosResponse.ok);
    const videos = videosResponse.ok ? await videosResponse.json() : [];
    
    const imagesResponse = await fetch(urls[2]);
    console.log('🖼️ PRODUCTION: Images status:', imagesResponse.status, imagesResponse.ok);
    const images = imagesResponse.ok ? await imagesResponse.json() : [];
    
    const websitesResponse = await fetch(urls[3]);
    console.log('🌐 PRODUCTION: Websites status:', websitesResponse.status, websitesResponse.ok);
    const websites = websitesResponse.ok ? await websitesResponse.json() : [];

    console.log('📊 PRODUCTION: Final results:', {
      books: books.length,
      videos: videos.length,
      images: images.length,
      websites: websites.length
    });

    return NextResponse.json({
      query,
      books,
      videos, 
      images,
      websites,
      timestamp: new Date().toISOString(),
      production: true
    });

  } catch (error) {
    console.error('💥 PRODUCTION: Search error:', error);
    // Check Vercel logs for this error message!
    return NextResponse.json({ 
      error: 'Production search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      books: [],
      videos: [],
      images: [],
      websites: []
    }, { status: 500 });
  }
}