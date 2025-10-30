"use client";

import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillTextEditorProps {
  isOpen: boolean;
  position: { x: number; y: number };
  initialText: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  onSave: (text: string) => void;
  onCancel: () => void;
  onTextChange?: (text: string, dimensions: { width: number; height: number }) => void;
}

const QuillTextEditor: React.FC<QuillTextEditorProps> = ({
  isOpen,
  position,
  initialText,
  fontSize,
  fontFamily,
  color,
  width,
  onSave,
  onCancel,
  onTextChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMounted || !editorRef.current) return;

    // Initialize Quill with custom toolbar
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'color': [] }],
          [{ 'align': [] }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          [{ 'font': [] }],
        ],
      },
      formats: ['bold', 'italic', 'underline', 'color', 'align', 'size', 'font'],
    });

    // Set initial content
    quillRef.current.root.innerHTML = initialText;
    
    // Apply styling
    const editor = quillRef.current.root;
    editor.style.fontSize = `${fontSize}px`;
    editor.style.fontFamily = fontFamily;
    editor.style.color = color;
    editor.style.width = `${width}px`;
    editor.style.minHeight = '40px';
    editor.style.lineHeight = '1.4';

    // Focus and select all
    setTimeout(() => {
      quillRef.current?.focus();
      quillRef.current?.setSelection(0, quillRef.current.getLength());
    }, 50);

    // Text change handler
    const handleTextChange = () => {
      if (!quillRef.current) return;
      
      const text = quillRef.current.root.innerHTML;
      const dimensions = {
        width: editor.scrollWidth,
        height: editor.scrollHeight
      };
      
      onTextChange?.(text, dimensions);
    };

    // Save handlers
    const handleBlur = () => {
      setTimeout(() => {
        if (quillRef.current) {
          onSave(quillRef.current.root.innerHTML);
        }
      }, 200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (quillRef.current) {
          onSave(quillRef.current.root.innerHTML);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    // Event listeners
    quillRef.current.on('text-change', handleTextChange);
    editor.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      editor.removeEventListener('blur', handleBlur);
      quillRef.current?.off('text-change', handleTextChange);
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [isOpen, isMounted, initialText, fontSize, fontFamily, color, width, onSave, onCancel, onTextChange]);

  if (!isOpen || !isMounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
        background: 'white',
        border: '2px solid #0099e5',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
        minWidth: '200px',
      }}
    >
      <div ref={editorRef} />
    </div>
  );
};

export default QuillTextEditor;