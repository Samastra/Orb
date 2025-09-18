"use client" 
import {useState} from 'react'
import {Tool} from '@/types/types'

interface ShapesMenuProps {
    activeTool: Tool | null;
    setActiveTool: (tool:Tool) => void;
    toolIcons:Record<string,string>;
}

const ShapesMenu = ({ activeTool, setActiveTool, toolIcons }: ShapesMenuProps) => {
    const [showShapes, setShowShapes] = useState(false);

    return (
    <div className="relative">
        
        
        {/* main shapes button */}

        <button onClick={() => setShowShapes((prev) => !prev)}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded 
            ${activeTool === "shapes" ? "bg-blue-300" : "bg-white hover:bg-gray-200"}`}
        >
            <img src={toolIcons.shapes} alt="shapes" className="w-6 h-6"/>   
            
        </button>
        
        {/* dropdown */}

                 {showShapes && (
        <div className="absolute left-12 top-0 flex flex-col bg-white shadow-md rounded p-2 z-50">
          <button
            className="px-2 py-1 hover:bg-gray-100 text-sm text-left"
            onClick={() => setActiveTool("rect")}
          >
            Rectangle
          </button>
          <button
            className="px-2 py-1 hover:bg-gray-100 text-sm text-left"
            onClick={() => setActiveTool("ellipse")}
          >
            Ellipse
          </button>
          <button
            className="px-2 py-1 hover:bg-gray-100 text-sm text-left"
            onClick={() => setActiveTool("triangle")}
          >
            Triangle
          </button>
          <button
            className="px-2 py-1 hover:bg-gray-100 text-sm text-left"
            onClick={() => setActiveTool("arrow")}
          >
            arrow
          </button>
        </div>
      )}
    </div>
  );
}
             
 

export default ShapesMenu