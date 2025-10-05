import { NextRequest, NextResponse } from 'next/server';

// Retry function with exponential backoff
const fetchWithRetry = async (url: string, retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1} for API after ${delay * (i + 1)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('All retries failed');
};

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

    // Use retry logic and reduce results for faster response
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=4&key=${googleApiKey}`
    );

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