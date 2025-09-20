// components/ShapesMenu.tsx
import React from 'react';

// Define the same Tool type from your BoardPage
type Tool = 
  | "select"
  | "stickyNote"
  | "text"
  | "rect"
  | "pen"
  | "connect"
  | "sort"
  | "join"
  | "ellipse"
  | "shapes"
  | "triangle"
  | "arrow"
  | "circle";

interface ShapesMenuProps {
  onSelectShape: (shapeType: Tool) => void;
}

const ShapesMenu: React.FC<ShapesMenuProps> = ({ onSelectShape }) => {
  const shapes = [
    { type: 'rect', label: 'Rectangle', icon: '/image/square.svg' },
    { type: 'circle', label: 'Circle', icon: '/image/circle.svg' },
    { type: 'ellipse', label: 'Ellipse', icon: '/image/ellipse.svg' },
    { type: 'triangle', label: 'Triangle', icon: '/image/triangle.svg' },
    { type: 'arrow', label: 'Arrow', icon: '/image/arrow-icon.svg' },
  ] as const;

  return (
    <div className="absolute left-20 top-0 bg-white p-3 rounded-md shadow-md z-20">
      <div className="flex flex-col space-y-2 items-center">
        {shapes.map((shape) => (
          <button
            key={shape.type}
            onClick={() => onSelectShape(shape.type as Tool)}
            className="flex flex-col items-center rounded hover:bg-gray-100"
          >
            <img src={shape.icon} alt={shape.label} className="w-6 h-6 mb-1" />
         </button>
        ))}
      </div>
    </div>
  );
};

export default ShapesMenu;