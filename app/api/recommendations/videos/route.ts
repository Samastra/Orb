import { NextRequest, NextResponse } from 'next/server';

interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeResponse {
  items?: YouTubeItem[];
}

// Same retry function
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

    // Use retry logic and reduce results
    const response = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=4&key=${googleApiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data: YouTubeResponse = await response.json();

    const videos = data.items?.map((item: YouTubeItem) => ({
      id: item.id.videoId,
      heading: item.snippet.title,
      body: item.snippet.channelTitle,
      image: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      alt: `YouTube video: ${item.snippet.title}`,
      type: 'video',
      videoId: item.id.videoId,
      url: `https://youtube.com/watch?v=${item.id.videoId}`,
      sourceData: item
    })) || [];

    return NextResponse.json(videos);
  } catch (error: unknown) {
    console.error('Videos API error:', error);
    return NextResponse.json([]);
  }
}