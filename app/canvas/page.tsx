'use client';

import { useCanvasState } from '@/hooks/useCanvasState';
import Toolbar from '@/components/Toolbar';
import Whiteboard from '@/components/Whiteboard';

export default function CanvasPage() {
  const canvasState = useCanvasState();

  return (
    <div className="w-screen h-screen bg-gray-100 overflow-hidden">
      <Toolbar
        toolMode={canvasState.toolMode}
        onToolChange={canvasState.setToolMode}
        onClear={canvasState.clearCanvas}
      />
      
      <div className="w-full h-full pt-16">
        <Whiteboard />
      </div>
    </div>
  );
}