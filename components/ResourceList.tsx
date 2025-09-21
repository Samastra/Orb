// components/ResourceList.tsx
"use client";

import { useEffect } from "react";

interface RelatedResourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RelatedResourcesPanel({ isOpen, onClose }: RelatedResourcesPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 w-80 h-[80vh] bg-white shadow-xl rounded-2xl border p-4 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Related Resources</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
      </div>

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-bold">📚 Books</h3>
          <ul className="list-disc list-inside text-sm">
            <li>Book 1 (link)</li>
            <li>Book 2 (link)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-bold">🌐 Websites</h3>
          <ul className="list-disc list-inside text-sm">
            <li><a href="#">Physics Resource</a></li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-bold">🎥 Videos</h3>
          <ul className="list-disc list-inside text-sm">
            <li><a href="#">Vector Explained (YouTube)</a></li>
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-bold">📝 Public Boards</h3>
          <ul className="list-disc list-inside text-sm">
            <li>Board 1</li>
            <li>Board 2</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
