import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const refresh = searchParams.get('refresh');
  const refreshCount = searchParams.get('refreshCount');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const pixabayApiKey = process.env.PIXABAY_API_KEY;
    
    if (!pixabayApiKey) {
      // Fallback with different images on refresh
      const placeholderSets = [
        [
          {
            id: 'photo-1',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_640.jpg',
            alt: 'Nature stock photo',
            type: 'photo',
            url: 'https://pixabay.com'
          },
          {
            id: 'vector-1',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2017/01/31/23/42/animal-2028258_640.png',
            alt: 'Animal vector illustration',
            type: 'vector',
            url: 'https://pixabay.com'
          }
        ],
        [
          {
            id: 'photo-2',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_640.jpg',
            alt: 'Space stock photo',
            type: 'photo',
            url: 'https://pixabay.com'
          },
          {
            id: 'vector-2',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2016/08/29/02/21/background-1627451_640.png',
            alt: 'Abstract vector background',
            type: 'vector',
            url: 'https://pixabay.com'
          }
        ],
        [
          {
            id: 'photo-3',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072823_640.jpg',
            alt: 'Landscape stock photo',
            type: 'photo',
            url: 'https://pixabay.com'
          },
          {
            id: 'vector-3',
            heading: '',
            body: '',
            image: 'https://cdn.pixabay.com/photo/2016/12/15/20/21/texture-1909992_640.png',
            alt: 'Texture vector design',
            type: 'vector',
            url: 'https://pixabay.com'
          }
        ]
      ];
      
      // Use refreshCount to cycle through different placeholder sets
      const setIndex = parseInt(refreshCount || '0') % placeholderSets.length;
      return NextResponse.json(placeholderSets[setIndex]);
    }

    // Enhanced query for refresh - add different terms to get varied results
    let enhancedQuery = query;
    if (refresh === 'true') {
      const imageVariations = [
        'creative', 'inspiration', 'ideas', 'concept', 'design',
        'art', 'visual', 'graphic', 'modern', 'trending',
        'background', 'texture', 'pattern', 'style', 'theme'
      ];
      
      const variationIndex = parseInt(refreshCount || '0') % imageVariations.length;
      enhancedQuery = `${query} ${imageVariations[variationIndex]}`;
    }

    // Use different page numbers for refresh to get different results
    const page = refresh === 'true' ? (parseInt(refreshCount || '0') % 3) + 1 : 1;

    // Fetch both photos AND vectors from Pixabay with page variation
    const [photosResponse, vectorsResponse] = await Promise.all([
      fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(enhancedQuery)}&image_type=photo&per_page=6&safesearch=true&page=${page}`),
      fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(enhancedQuery)}&image_type=vector&per_page=6&safesearch=true&page=${page}`)
    ]);

    if (!photosResponse.ok || !vectorsResponse.ok) {
      throw new Error('Pixabay API request failed');
    }

    const photosData = await photosResponse.json();
    const vectorsData = await vectorsResponse.json();

    // Process photos - NO TEXT
    const photos = photosData.hits?.map((photo: any) => ({
      id: `photo-${photo.id}-${refreshCount || '0'}`,
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
      id: `vector-${vector.id}-${refreshCount || '0'}`,
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

    // If no results from API, use fallback but vary based on refresh
    if (allImages.length === 0) {
      const fallbackSets = [
        [
          {
            id: 'fallback-photo-1',
            heading: '',
            body: '',
            image: '/photo-placeholder.svg',
            alt: 'Nature photo',
            type: 'photo'
          },
          {
            id: 'fallback-vector-1',
            heading: '',
            body: '',
            image: '/vector-placeholder.svg', 
            alt: 'Design vector',
            type: 'vector'
          }
        ],
        [
          {
            id: 'fallback-photo-2',
            heading: '',
            body: '',
            image: '/photo-placeholder.svg',
            alt: 'Landscape photo',
            type: 'photo'
          },
          {
            id: 'fallback-vector-2',
            heading: '',
            body: '',
            image: '/vector-placeholder.svg', 
            alt: 'Art vector',
            type: 'vector'
          }
        ]
      ];
      
      const setIndex = parseInt(refreshCount || '0') % fallbackSets.length;
      return NextResponse.json(fallbackSets[setIndex]);
    }

    return NextResponse.json(allImages);
  } catch (error) {
    console.error('Images API error:', error);
    
    // Fallback with variation based on refresh count
    const fallbackSets = [
      [
        {
          id: 'error-photo-1',
          heading: '',
          body: '',
          image: '/photo-placeholder.svg',
          alt: 'Stock photo',
          type: 'photo'
        },
        {
          id: 'error-vector-1',
          heading: '',
          body: '',
          image: '/vector-placeholder.svg', 
          alt: 'Vector illustration',
          type: 'vector'
        }
      ],
      [
        {
          id: 'error-photo-2',
          heading: '',
          body: '',
          image: '/photo-placeholder.svg',
          alt: 'Photo placeholder',
          type: 'photo'
        },
        {
          id: 'error-vector-2',
          heading: '',
          body: '',
          image: '/vector-placeholder.svg', 
          alt: 'Vector placeholder',
          type: 'vector'
        }
      ]
    ];
    
    const setIndex = parseInt(refreshCount || '0') % fallbackSets.length;
    return NextResponse.json(fallbackSets[setIndex]);
  }
}