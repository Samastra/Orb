// components/TextEditor.tsx
"use client";

import { useEffect, useRef } from 'react';
import { Html } from 'react-konva-utils';
import Konva from 'konva';

interface TextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onChange: (text: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ textNode, onClose, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current || !textNode) return;

    const textarea = textareaRef.current;
    const stage = textNode.getStage();
    if (!stage) return;

    const textPosition = textNode.position();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    // Match styles exactly with the text node (like Konva example)
    textarea.value = textNode.text();
    textarea.style.position = 'fixed';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - (textNode.padding() || 0) * 2}px`;
    textarea.style.height = `${textNode.height() - (textNode.padding() || 0) * 2 + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = 'none'; // Remove border for cleaner look
    textarea.style.padding = '0px'; // Remove padding to match text node exactly
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none'; // Transparent background
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily() || 'Arial, sans-serif';
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill().toString();
    textarea.style.zIndex = '1000';
    textarea.style.boxSizing = 'border-box';

    // Handle rotation like Konva example
    const rotation = textNode.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    
    // Add scale transformation to match the stage
    const scale = textNode.getAbsoluteScale().x;
    if (scale !== 1) {
      transform += ` scale(${scale})`;
    }
    
    textarea.style.transform = transform;

    // Auto-adjust height based on content
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();
    textarea.select(); // Select all text for easy editing

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        onChange(textarea.value);
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onChange(textarea.value);
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Prevent propagation to avoid stage events
      e.stopPropagation();
    };

    const handleInput = () => {
      // Auto-resize textarea as user types
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
      
      // Update width to match text node's scaled width
      const scale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * scale}px`;
    };

    // Add event listeners
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);
    
    // Add click outside handler with slight delay
    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [textNode, onChange, onClose]);

  return (
    <Html>
      <textarea
        ref={textareaRef}
        style={{
          minHeight: '1em',
          position: 'fixed',
        }}
      />
    </Html>
  );
};

export default TextEditor;