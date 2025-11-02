import { NextRequest, NextResponse } from 'next/server';

// Helper function to safely parse responses
async function safeJsonParse(response: Response) {
  try {
    const text = await response.text();
    
    // Check if response is HTML (error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.warn('Received HTML response instead of JSON');
      return [];
    }
    
    // Try to parse as JSON
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse response as JSON:', error);
    return [];
  }
}

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

    // Fetch from all APIs in parallel with better error handling
    const apiCalls = [
      { name: 'books', url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/books?query=${encodeURIComponent(enhancedQuery)}` },
      { name: 'videos', url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/videos?query=${encodeURIComponent(enhancedQuery)}` },
      { name: 'images', url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/images?query=${encodeURIComponent(enhancedQuery)}` },
      { name: 'websites', url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/recommendations/websites?query=${encodeURIComponent(enhancedQuery)}` },
    ];

    const responses = await Promise.allSettled(
      apiCalls.map(api => 
        fetch(api.url, {
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }).catch(error => {
          console.warn(`Failed to fetch from ${api.name}:`, error);
          return null;
        })
      )
    );

    // Process responses with safe parsing
    const results = await Promise.all(
      responses.map(async (response, index) => {
        const apiName = apiCalls[index].name;
        
        if (response.status === 'fulfilled' && response.value) {
          try {
            const data = await safeJsonParse(response.value);
            return Array.isArray(data) ? data : [];
          } catch (error) {
            console.warn(`Failed to parse ${apiName} response:`, error);
            return [];
          }
        } else {
          console.warn(`${apiName} API call failed:`, response.status === 'rejected' ? response.reason : 'No response');
          return [];
        }
      })
    );

    const [books, videos, images, websites] = results;

    return NextResponse.json({
      query: enhancedQuery,
      books,
      videos, 
      images,
      websites,
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