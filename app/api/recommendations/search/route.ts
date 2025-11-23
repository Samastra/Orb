// app/api/recommendations/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllRecommendations } from '@/lib/getRecommendations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const { books, videos, images, websites } = await getAllRecommendations(query, request);

    return NextResponse.json({
      query,
      books,
      videos,
      images,
      websites,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}