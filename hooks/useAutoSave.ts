import { useCallback, useRef } from 'react';
import { saveBoardElements } from '@/lib/actions/board-elements-actions';

export const useAutoSave = (boardId: string, isTemporaryBoard: boolean, userId?: string) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback((elements: {
    reactShapes: any[];
    konvaShapes: any[];
    stageFrames: any[];
    images: any[];
    connections: any[];
  }) => {
    if (!boardId || isTemporaryBoard || !userId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce save to avoid spamming
    timeoutRef.current = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving board...');
        await saveBoardElements(
          boardId,
          elements,
          undefined, // No stage state for auto-save
          userId
        );
        console.log('✅ Auto-save completed');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, 2000); // Save 2 seconds after last change
  }, [boardId, isTemporaryBoard, userId]);

  return { triggerSave };
};