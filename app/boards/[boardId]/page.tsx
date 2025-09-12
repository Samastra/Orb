"use client";

import dynamic from "next/dynamic";

// --- Dynamic imports for Konva ---
const Stage =  dynamic(() => import("react-konva").then(mod => mod.Stage), { ssr: false });
import { Layer, Rect } from "react-konva";

const BoardPage = () => {

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-50">
      {/* Fullscreen Canvas */}
      <Stage
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
      >
        <Layer>
          <Rect
            x={100}
            y={120}
            width={150}
            height={100}
            fill="lightblue"
            draggable
          />
        </Layer>
      </Stage>

      {/* Floating toolbar (example) */}
      <div className="absolute top-4 left-4 bg-white p-3 shadow-lg rounded-lg">
        <button className="block mb-2">📄 Tool 1</button>
        <button className="block mb-2">✏️ Tool 2</button>
        <button className="block">🔗 Tool 3</button>
      </div>

      {/* Floating recommendations panel (example) */}
      <div className="absolute top-4 right-4 w-64 h-40 bg-white p-3 shadow-lg rounded-lg">
        <h2 className="font-bold mb-2">Recommendations</h2>
        <div className="flex space-x-2">
          <button>Books</button>
          <button>Sites</button>
          <button>Videos</button>
        </div>
      </div>

      {/* Floating chat panel (example) */}
      <div className="absolute bottom-4 right-4 w-64 h-40 bg-white p-3 shadow-lg rounded-lg">
        <h2 className="font-bold mb-2">Chat</h2>
        <div className="h-24 border rounded mb-2 overflow-y-auto p-2">
          {/* chat messages go here */}
        </div>
        <input
          type="text"
          placeholder="Type..."
          className="w-full border px-2 py-1 rounded"
        />
      </div>
    </div>
  );
}

export default BoardPage;