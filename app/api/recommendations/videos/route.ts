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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=8&key=${googleApiKey}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status}`);
    }

    const data = await response.json();

    const videos = data.items?.map((item: any) => ({
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
  } catch (error: any) {
    console.error('Videos API error:', error);
    return NextResponse.json([]);
  }
}