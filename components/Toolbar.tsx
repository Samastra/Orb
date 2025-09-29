'use client';

import { ToolMode } from '@/types/canvas';

interface ToolbarProps {
  toolMode: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  onClear: () => void;
}

export default function Toolbar({ toolMode, onToolChange, onClear }: ToolbarProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-2 z-10">
      <button
        className={`px-4 py-2 rounded-md transition-colors ${
          toolMode === 'pan' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        onClick={() => onToolChange('pan')}
      >
        Pan
      </button>
      
      <button
        className={`px-4 py-2 rounded-md transition-colors ${
          toolMode === 'draw' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        onClick={() => onToolChange('draw')}
      >
        Draw
      </button>
      
      <button
        className={`px-4 py-2 rounded-md transition-colors ${
          toolMode === 'erase' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        onClick={() => onToolChange('erase')}
      >
        Erase
      </button>
      
      <div className="w-px bg-gray-300 mx-1"></div>
      
      <button
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  );
}