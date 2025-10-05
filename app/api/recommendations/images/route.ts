import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const freepikApiKey = process.env.FREEPIK_API_KEY;
    
    // Search Freepik for educational/content images
    const response = await fetch(
      `https://api.freepik.com/v1/resources?term=${encodeURIComponent(query + " education diagram infographic")}&page=1&limit=10&locale=en-US`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Freepik-API-Key': freepikApiKey!
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Freepik API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match ResourceCard props
    const images = data.data?.map((item: any) => ({
      id: item.id,
      heading: item.description || 'Educational Image',
      body: `By ${item.user?.name || 'Freepik'}`,
      image: item.image?.source || item.image?.source_640 || '/image-placeholder.png',
      alt: item.description || `Educational image for ${query}`,
      type: 'image',
      sourceData: item
    })) || [];

    return NextResponse.json(images);
  } catch (error) {
    console.error('Images API error:', error);
    
    // Fallback to placeholder images if Freepik fails
    const fallbackImages = [
      {
        id: '1',
        heading: `${query} Diagram`,
        body: 'Educational content image',
        image: '/diagram-placeholder.png',
        alt: `Diagram for ${query}`,
        type: 'image'
      }
    ];
    
    return NextResponse.json(fallbackImages);
  }
}