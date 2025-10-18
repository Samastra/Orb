"use client";

import { useState, useCallback } from 'react';

interface VideoState {
  videoId: string | null;
  title: string;
  isOpen: boolean;
}

export const useVideoPlayer = () => {
  const [videoState, setVideoState] = useState<VideoState>({
    videoId: null,
    title: '',
    isOpen: false
  });

  // Open a video (automatically closes any previous one)
  const openVideo = useCallback((videoId: string, title: string = 'YouTube Video') => {
    console.log('🎬 Opening video:', videoId, title);
    
    setVideoState({
      videoId,
      title,
      isOpen: true
    });
  }, []);

  // Close the current video
  const closeVideo = useCallback(() => {
    console.log('🎬 Closing video');
    
    setVideoState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // Check if a specific video is currently playing
  const isVideoPlaying = useCallback((videoId: string) => {
    return videoState.isOpen && videoState.videoId === videoId;
  }, [videoState]);

  return {
    // State
    videoId: videoState.videoId,
    videoTitle: videoState.title,
    isVideoOpen: videoState.isOpen,
    
    // Actions
    openVideo,
    closeVideo,
    isVideoPlaying
  };
};