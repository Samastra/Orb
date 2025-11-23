// app/api/recommendations/search/route.ts - DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Search route called!');
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const baseUrl = request.nextUrl.origin;
    console.log('🌐 DEBUG: Base URL:', baseUrl);

    // Test with SIMPLE query first
    const simpleQuery = "test";
    
    const urls = [
      `${baseUrl}/api/recommendations/books?query=${encodeURIComponent(simpleQuery)}`,
      `${baseUrl}/api/recommendations/videos?query=${encodeURIComponent(simpleQuery)}`,
      `${baseUrl}/api/recommendations/images?query=${encodeURIComponent(simpleQuery)}`,
      `${baseUrl}/api/recommendations/websites?query=${encodeURIComponent(simpleQuery)}`,
    ];

    console.log('📡 DEBUG: URLs to fetch:', urls);

    // DEBUG: Test each API individually first
    console.log('🧪 DEBUG: Testing APIs individually...');
    
    // Test Books API
    console.log('📚 Testing Books API...');
    const booksTest = await fetch(urls[0]);
    console.log('📚 Books status:', booksTest.status, booksTest.ok);
    const booksData = await booksTest.json();
    console.log('📚 Books data:', booksData);
    
    // Test Videos API  
    console.log('🎬 Testing Videos API...');
    const videosTest = await fetch(urls[1]);
    console.log('🎬 Videos status:', videosTest.status, videosTest.ok);
    const videosData = await videosTest.json();
    console.log('🎬 Videos data:', videosData);
    
    // Test Images API
    console.log('🖼️ Testing Images API...');
    const imagesTest = await fetch(urls[2]);
    console.log('🖼️ Images status:', imagesTest.status, imagesTest.ok);
    const imagesData = await imagesTest.json();
    console.log('🖼️ Images data:', imagesData);
    
    // Test Websites API
    console.log('🌐 Testing Websites API...');
    const websitesTest = await fetch(urls[3]);
    console.log('🌐 Websites status:', websitesTest.status, websitesTest.ok);
    const websitesData = await websitesTest.json();
    console.log('🌐 Websites data:', websitesData);

    // Now try the Promise.all approach
    console.log('🔄 DEBUG: Now testing Promise.allSettled...');
    
    const [booksResponse, videosResponse, imagesResponse, websitesResponse] = await Promise.allSettled([
      fetch(urls[0]),
      fetch(urls[1]),
      fetch(urls[2]),
      fetch(urls[3]),
    ]);

    console.log('📦 DEBUG: Promise.allSettled results:', {
      books: booksResponse.status,
      videos: videosResponse.status,
      images: imagesResponse.status, 
      websites: websitesResponse.status
    });

    // Simple processing - no fancy function
    const books = booksResponse.status === 'fulfilled' && booksResponse.value.ok 
      ? await booksResponse.value.json() 
      : [];

    const videos = videosResponse.status === 'fulfilled' && videosResponse.value.ok 
      ? await videosResponse.value.json() 
      : [];

    const images = imagesResponse.status === 'fulfilled' && imagesResponse.value.ok 
      ? await imagesResponse.value.json() 
      : [];

    const websites = websitesResponse.status === 'fulfilled' && websitesResponse.value.ok 
      ? await websitesResponse.value.json() 
      : [];

    console.log('🎯 DEBUG: Final processed data:', {
      booksLength: books.length,
      videosLength: videos.length, 
      imagesLength: images.length,
      websitesLength: websites.length
    });

    return NextResponse.json({
      query: simpleQuery,
      books,
      videos,
      images, 
      websites,
      timestamp: new Date().toISOString(),
      debug: true
    });

  } catch (error) {
    console.error('💥 DEBUG: Search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      debugError: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}