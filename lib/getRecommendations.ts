// lib/getRecommendations.ts
import { GET as booksGET } from '@/app/api/recommendations/books/route';
import { GET as videosGET } from '@/app/api/recommendations/videos/route';
import { GET as imagesGET } from '@/app/api/recommendations/images/route';
import { GET as websitesGET } from '@/app/api/recommendations/websites/route';
import type { NextRequest } from 'next/server';

export async function getAllRecommendations(query: string, originalRequest: NextRequest) {
  const url = new URL(originalRequest.url);
  url.pathname = '/fake';
  url.searchParams.set('query', query);

  const fakeRequest = new Request(url.toString(), {
    method: 'GET',
    headers: originalRequest.headers,
  }) as NextRequest;

  const [booksRes, videosRes, imagesRes, websitesRes] = await Promise.all([
    booksGET(fakeRequest),
    videosGET(fakeRequest),
    imagesGET(fakeRequest),
    websitesGET(fakeRequest),
  ]);

  const books = booksRes.ok ? await booksRes.json() : [];
  const videos = videosRes.ok ? await videosRes.json() : [];
  const images = imagesRes.ok ? await imagesRes.json() : [];
  const websites = websitesRes.ok ? await websitesRes.json() : [];

  return { books, videos, images, websites };
}