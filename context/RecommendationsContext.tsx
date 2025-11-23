// context/RecommendationsContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  images: Resource[];
  websites: Resource[];
  query?: string;
  timestamp?: string;
}

interface RecommendationsContextType {
  recommendations: SearchResults;
  setRecommendations: (results: SearchResults) => void;
  clearRecommendations: () => void;
  hasCachedRecommendations: boolean;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

// localStorage key
const STORAGE_KEY = 'orb-recommendations-cache';
// Cache expiry time (1 hour)
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

export const RecommendationsProvider = ({ children }: { children: ReactNode }) => {
  const [recommendations, setRecommendationsState] = useState<SearchResults>({
    books: [],
    videos: [],
    images: [],
    websites: []
  });
  const [hasCachedRecommendations, setHasCachedRecommendations] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadCachedRecommendations = () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          
          // Check if cache is still valid
          if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime()) < CACHE_EXPIRY_MS) {
            setRecommendationsState(parsed);
            setHasCachedRecommendations(true);
            console.log('📁 Loaded cached recommendations');
          } else {
            // Cache expired, clear it
            localStorage.removeItem(STORAGE_KEY);
            setHasCachedRecommendations(false);
          }
        }
      } catch (error) {
        console.error('Error loading cached recommendations:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadCachedRecommendations();
  }, []);

  // Save to localStorage whenever recommendations change
  const setRecommendations = (results: SearchResults) => {
    const resultsWithTimestamp = {
      ...results,
      timestamp: new Date().toISOString()
    };
    
    setRecommendationsState(resultsWithTimestamp);
    setHasCachedRecommendations(true);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resultsWithTimestamp));
    } catch (error) {
      console.error('Error saving recommendations to cache:', error);
    }
  };

  const clearRecommendations = () => {
    const emptyResults = {
      books: [],
      videos: [],
      images: [],
      websites: []
    };
    
    setRecommendationsState(emptyResults);
    setHasCachedRecommendations(false);
    
    // Clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recommendations cache:', error);
    }
  };

  return (
    <RecommendationsContext.Provider value={{ 
      recommendations, 
      setRecommendations, 
      clearRecommendations,
      hasCachedRecommendations 
    }}>
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