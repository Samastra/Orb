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

    // Match styles with the text node
    textarea.value = textNode.text();
    textarea.style.position = 'fixed';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - (textNode.padding() || 0) * 2}px`;
    textarea.style.height = `${textNode.height() - (textNode.padding() || 0) * 2 + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = '2px solid #007bff';
    textarea.style.padding = '4px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'white';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily() || 'Arial, sans-serif';
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill().toString();
    textarea.style.zIndex = '1000';
    textarea.style.boxSizing = 'border-box';

    const rotation = textNode.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();

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
    };

    const handleInput = () => {
      const scale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * scale}px`;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);
    
    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    });

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