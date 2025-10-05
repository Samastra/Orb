import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&key=${googleApiKey}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Books API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match ResourceCard props
    const books = data.items?.map((item: any) => ({
      id: item.id,
      heading: item.volumeInfo.title,
      body: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
      image: item.volumeInfo.imageLinks?.thumbnail || null,
      alt: `Book cover for ${item.volumeInfo.title}`,
      type: 'book',
      url: item.volumeInfo.infoLink,
      sourceData: item
    })) || [];

    return NextResponse.json(books);
  } catch (error: any) {
    console.error('Books API error:', error);
    
    // Return empty array instead of error to prevent breaking the UI
    return NextResponse.json([]);
  }
}