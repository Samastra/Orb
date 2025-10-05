import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const serpapiKey = process.env.SERPAPI_API_KEY;
    
    if (!serpapiKey) {
      throw new Error('SerpAPI key not configured');
    }

    // Use SerpAPI for Google-like search results
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query + " tutorial learning guide")}&engine=google&api_key=${serpapiKey}`
    );

    if (!response.ok) {
      throw new Error('SerpAPI request failed');
    }

    const data = await response.json();

    // Transform organic search results
    const websites = data.organic_results?.map((result: any, index: number) => ({
      id: `web-${index}`,
      heading: result.title,
      body: result.snippet,
      image: '/website-placeholder.png', // SerpAPI doesn't provide images in organic results
      alt: `Website: ${result.title}`,
      type: 'website',
      url: result.link,
      source: result.source,
      sourceData: result
    })).slice(0, 10) || []; // Get top 10 results

    // If no results from SerpAPI, fallback to Wikipedia
    if (websites.length === 0) {
      return await getWikipediaFallback(query);
    }

    return NextResponse.json(websites);
  } catch (error) {
    console.error('Websites API error:', error);
    // Fallback to Wikipedia if SerpAPI fails
    return await getWikipediaFallback(query);
  }
}

// Wikipedia fallback function
async function getWikipediaFallback(query: string) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    
    if (response.ok) {
      const data = await response.json();
      const website = {
        id: 'wikipedia',
        heading: data.title || query,
        body: data.extract || 'Wikipedia article',
        image: data.thumbnail?.source || '/wikipedia-placeholder.png',
        alt: `Wikipedia: ${data.title}`,
        type: 'website',
        url: data.content_urls?.desktop?.page,
        source: 'Wikipedia',
        sourceData: data
      };
      return NextResponse.json([website]);
    }
  } catch (wikipediaError) {
    console.error('Wikipedia fallback also failed:', wikipediaError);
  }

  // Ultimate fallback
  const fallbackWebsites = [{
    id: 'fallback-1',
    heading: `Learn ${query} - Online Resources`,
    body: `Search for ${query} tutorials and learning resources online`,
    image: '/website-placeholder.png',
    alt: `Online resources for ${query}`,
    type: 'website',
    url: `https://www.google.com/search?q=${encodeURIComponent(query + " tutorial")}`,
    source: 'Google Search'
  }];
  
  return NextResponse.json(fallbackWebsites);
}