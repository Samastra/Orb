// components/TextComponent.tsx
"use client";

import React, { useRef, useEffect, useCallback, forwardRef } from "react";
import { Group, Text as KonvaText, Rect, Transformer } from "react-konva";
import Konva from "konva";

interface TextComponentProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  width?: number;
  rotation?: number;
  isSelected: boolean;
  isEditing: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (attrs: any) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
}

const TextComponent = forwardRef<Konva.Group, TextComponentProps>(
  (
    {
      id,
      x,
      y,
      text: initialText,
      fontSize,
      fill,
      fontFamily = "Inter, Arial, sans-serif",
      fontWeight = "400",
      fontStyle = "normal",
      align = "left",
      width = 200,
      rotation = 0,
      isSelected,
      isEditing,
      activeTool,
      onSelect,
      onUpdate,
      onStartEditing,
      onFinishEditing,
    },
    ref
  ) => {
    const groupRef = useRef<Konva.Group>(null);
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // **1. SELECT → SHOW TRANSFORMER**
    useEffect(() => {
      if (isSelected && groupRef.current && trRef.current && !isEditing) {
        trRef.current.nodes([groupRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
      }
    }, [isSelected, isEditing]);

    // **2. IMMEDIATE EDITING WHEN CREATED**
    useEffect(() => {
      if (isEditing && groupRef.current && textRef.current) {
        const stage = groupRef.current.getStage();
        if (!stage) return;

        // **CREATE CONTENTEDITABLE DIV**
        const editor = document.createElement("div");
        document.body.appendChild(editor);
        editorRef.current = editor;

        // **EXACT POSITIONING**
        const textNode = textRef.current;
        const textPos = textNode.getAbsolutePosition();
        const stageContainer = stage.container();
        const stageRect = stageContainer.getBoundingClientRect();

        const screenX = stageRect.left + textPos.x;
        const screenY = stageRect.top + textPos.y;

        // **SET CONTENT AND EXACT STYLING (NO BORDERS/PADDING)**
        editor.innerHTML = initialText || "";
        Object.assign(editor.style, {
          position: "fixed",
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${width}px`,
          fontSize: `${fontSize}px`,
          fontFamily,
          fontWeight,
          fontStyle,
          color: fill,
          textAlign: align,
          lineHeight: "1.4",
          border: "none",
          padding: "0px",
          margin: "0px",
          borderRadius: "0px",
          background: "transparent",
          boxShadow: "none",
          outline: "none",
          zIndex: "10000",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "top left",
          cursor: "text",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          minHeight: `${fontSize * 1.4}px`,
        });

        // **MAKE EDITABLE AND FOCUS**
        editor.contentEditable = "true";
        
        setTimeout(() => {
          editor.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }, 50);

        // **AUTO-RESIZE HEIGHT AS YOU TYPE**
        const resize = () => {
          editor.style.height = "auto";
          editor.style.height = `${editor.scrollHeight}px`;
        };
        editor.addEventListener("input", resize);
        resize();

        // **SAVE ON BLUR**
        const handleBlur = () => {
          if (editor.parentNode) {
            onUpdate({ text: editor.innerHTML });
            onFinishEditing();
          }
        };

        // **SAVE ON ENTER**
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            editor.blur();
          } else if (e.key === "Escape") {
            editor.blur();
          }
        };

        editor.addEventListener("blur", handleBlur);
        editor.addEventListener("keydown", handleKeyDown);

        // **CLEANUP**
        return () => {
          if (editor.parentNode) {
            editor.removeEventListener("input", resize);
            editor.removeEventListener("keydown", handleKeyDown);
            editor.removeEventListener("blur", handleBlur);
            document.body.removeChild(editor);
          }
        };
      }
    }, [
      isEditing,
      initialText,
      width,
      fontSize,
      fill,
      fontFamily,
      fontWeight,
      fontStyle,
      align,
      rotation,
      onUpdate,
      onFinishEditing,
    ]);

    // **3. DRAG END**
    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      onUpdate({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      });
    }, [onUpdate]);

    // **4. TRANSFORM - HANDLED IN REAL-TIME (FIXED!)**
    const handleTransform = useCallback(() => {
      const group = groupRef.current;
      const transformer = trRef.current;
      
      if (!group || !transformer) return;

      const activeAnchor = transformer.getActiveAnchor();
      const isMiddleAnchor = activeAnchor?.includes('middle-left') || activeAnchor?.includes('middle-right');
      
      if (isMiddleAnchor) {
        // MIDDLE ANCHOR: Update width only, reset scale immediately
        const newWidth = Math.max(50, width * group.scaleX());
        group.scaleX(1); // RESET SCALE IMMEDIATELY
        
        onUpdate({ width: newWidth });
      } else {
        // CORNER ANCHOR: Scale proportionally
        const newWidth = Math.max(50, width * group.scaleX());
        const newFontSize = Math.max(12, fontSize * group.scaleX());
        group.scaleX(1);
        group.scaleY(1);
        
        onUpdate({ 
          width: newWidth, 
          fontSize: newFontSize 
        });
      }
    }, [width, fontSize, onUpdate]);

    // **5. CLICK → SELECT (NOT EDIT)**
    const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (activeTool === "select" && !isEditing) {
        onSelect();
      }
    }, [activeTool, isEditing, onSelect]);

    // **6. DOUBLE-CLICK → EDIT (FOR EXISTING TEXT)**
    const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (!isEditing) {
        onStartEditing();
      }
    }, [isEditing, onStartEditing]);

    return (
      <>
        <Group
          ref={groupRef}
          x={x}
          y={y}
          rotation={rotation}
          draggable={!isEditing}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform} // CHANGED: onTransform instead of onTransformEnd
          onClick={handleClick}
          onTap={handleClick}
          onDblClick={handleDblClick}
          onDblTap={handleDblClick}
          name="selectable-shape"
          id={id}
        >
          {/* **HIT BOX** */}
          <Rect
            width={width}
            height={fontSize * 1.8}
            fill="transparent"
            stroke={isSelected ? "#0099e5" : "transparent"}
            strokeWidth={isSelected ? 2 : 0}
          />

          {/* **VISIBLE TEXT** */}
          <KonvaText
            ref={textRef}
            text={initialText || "Click to edit"}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontStyle={fontStyle}
            fill={fill}
            align={align}
            width={width}
            wrap="word"
            lineHeight={1.4}
            listening={false}
          />
        </Group>

        {/* **TRANSFORMER WITH SMART ANCHOR BEHAVIOR** */}
        {isSelected && !isEditing && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              const transformer = trRef.current;
              if (transformer) {
                const activeAnchor = transformer.getActiveAnchor();
                const isMiddleAnchor = activeAnchor?.includes('middle-left') || activeAnchor?.includes('middle-right');
                
                if (isMiddleAnchor) {
                  // Middle anchors: only change width, keep height
                  return {
                    ...newBox,
                    width: Math.max(30, newBox.width),
                    height: oldBox.height,
                  };
                }
              }
              
              // Corner anchors: scale proportionally
              return {
                ...newBox,
                width: Math.max(30, newBox.width),
                height: Math.max(30, newBox.height),
              };
            }}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left', 'top-right', 
              'bottom-left', 'bottom-right',
              'middle-left', 'middle-right'
            ]}
          />
        )}
      </>
    );
  }
);

TextComponent.displayName = "TextComponent";
export default TextComponent;