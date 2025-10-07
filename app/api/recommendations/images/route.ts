import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const pixabayApiKey = process.env.PIXABAY_API_KEY;
    
    if (!pixabayApiKey) {
      // Fallback with both photos and vectors - NO TEXT
      const placeholderImages = [
        {
          id: 'photo-1',
          heading: '', // Empty
          body: '', // Empty
          image: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_640.jpg',
          alt: 'Stock photo',
          type: 'photo',
          url: 'https://pixabay.com'
        },
        {
          id: 'vector-1',
          heading: '', // Empty
          body: '', // Empty
          image: 'https://cdn.pixabay.com/photo/2017/01/31/23/42/animal-2028258_640.png',
          alt: 'Vector illustration',
          type: 'vector',
          url: 'https://pixabay.com'
        }
      ];
      return NextResponse.json(placeholderImages);
    }

    // Fetch both photos AND vectors from Pixabay
    const [photosResponse, vectorsResponse] = await Promise.all([
      fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=6&safesearch=true`),
      fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(query)}&image_type=vector&per_page=6&safesearch=true`)
    ]);

    if (!photosResponse.ok || !vectorsResponse.ok) {
      throw new Error('Pixabay API request failed');
    }

    const photosData = await photosResponse.json();
    const vectorsData = await vectorsResponse.json();

    // Process photos - NO TEXT
    const photos = photosData.hits?.map((photo: any) => ({
      id: `photo-${photo.id}`,
      heading: '', // Empty
      body: '', // Empty
      image: photo.webformatURL,
      alt: photo.tags || `Photo`,
      type: 'photo',
      url: photo.pageURL,
      sourceData: photo
    })) || [];

    // Process vectors - NO TEXT
    const vectors = vectorsData.hits?.map((vector: any) => ({
      id: `vector-${vector.id}`,
      heading: '', // Empty
      body: '', // Empty
      image: vector.webformatURL,
      alt: vector.tags || `Vector`,
      type: 'vector', 
      url: vector.pageURL,
      sourceData: vector
    })) || [];

    // Combine photos and vectors into one array
    const allImages = [...photos, ...vectors];

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Images API error:', error);
    
    // Fallback with both types - NO TEXT
    const fallbackImages = [
      {
        id: 'fallback-photo-1',
        heading: '', // Empty
        body: '', // Empty
        image: '/photo-placeholder.svg',
        alt: 'Photo',
        type: 'photo'
      },
      {
        id: 'fallback-vector-1',
        heading: '', // Empty
        body: '', // Empty
        image: '/vector-placeholder.svg', 
        alt: 'Vector',
        type: 'vector'
      }
    ];
    
    return NextResponse.json(fallbackImages);
  }
}