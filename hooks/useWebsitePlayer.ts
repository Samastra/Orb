"use client";

import { useState, useCallback } from 'react';

interface WebsiteState {
  url: string | null;
  title: string;
  isOpen: boolean;
}

export const useWebsitePlayer = () => {
  const [websiteState, setWebsiteState] = useState<WebsiteState>({
    url: null,
    title: '',
    isOpen: false
  });

  const openWebsite = useCallback((url: string, title: string = 'Website') => {
    console.log('🌐 Opening website:', url, title);
    
    setWebsiteState({
      url,
      title,
      isOpen: true
    });
  }, []);

  const closeWebsite = useCallback(() => {
    console.log('🌐 Closing website');
    
    setWebsiteState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  return {
    websiteUrl: websiteState.url,
    websiteTitle: websiteState.title,
    isWebsiteOpen: websiteState.isOpen,
    openWebsite,
    closeWebsite
  };
};