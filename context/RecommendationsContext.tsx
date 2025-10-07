"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Resource {
  id: string;
  heading: string;
  body?: string;
  image?: string;
  alt: string;
  type: string;
  url?: string;
  videoId?: string;
  sourceData?: any;
}

interface SearchResults {
  books: Resource[];
  videos: Resource[];
  images: Resource[]; // Changed from photos/vectors to images
  websites: Resource[];
}

interface RecommendationsContextType {
  recommendations: SearchResults;
  setRecommendations: (results: SearchResults) => void;
  clearRecommendations: () => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export const RecommendationsProvider = ({ children }: { children: ReactNode }) => {
  const [recommendations, setRecommendations] = useState<SearchResults>({
    books: [],
    videos: [],
    images: [], // Changed from photos/vectors to images
    websites: []
  });

  const clearRecommendations = () => {
    setRecommendations({
      books: [],
      videos: [],
      images: [], // Changed from photos/vectors to images
      websites: []
    });
  };

  return (
    <RecommendationsContext.Provider value={{ recommendations, setRecommendations, clearRecommendations }}>
      {children}
    </RecommendationsContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};