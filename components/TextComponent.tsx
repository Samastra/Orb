"use client";
import React, { useRef, useEffect, useCallback, forwardRef } from "react";
import { Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";

// Helper type to resolve MouseEvent vs TouchEvent TypeScript conflict
type KonvaPointerEvent = KonvaEventObject<MouseEvent | TouchEvent>;

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
  onUpdate: (attrs: {
    x?: number;
    y?: number;
    width?: number;
    fontSize?: number;
    rotation?: number;
    text?: string;
    fontWeight?: string;
    fontFamily?: string;
    fontStyle?: string;
    fill?: string;
    align?: "left" | "center" | "right";
  }) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const TextComponent = forwardRef<Konva.Text, TextComponentProps>(
  (
    {
      id,
      x,
      y,
      text: initialText,
      fontSize,
      fill,
      fontFamily = "Arial",
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
      onDragStart,
      onDragMove,
      onDragEnd,
      onTransformEnd,
      onStartEditing,
      onFinishEditing,
    }
  ) => {
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const isNew = useRef(true);

    // 1. Compute combined fontStyle for Konva
    const konvaFontStyle = (() => {
      const stylePart = fontStyle === "normal" ? "" : fontStyle;
      const weightPart =
        fontWeight === "400" || fontWeight === "normal"
          ? ""
          : fontWeight === "bold"
          ? "bold"
          : fontWeight; 
      return `${stylePart} ${weightPart}`.trim() || "normal";
    })();

    // 2. Force Konva update when font props change
    useEffect(() => {
      if (textRef.current && !isEditing) {
        const node = textRef.current;
        node.setAttrs({
          fontFamily,
          fontStyle: konvaFontStyle,
          fontSize,
          fill,
          align
        });
        node.getLayer()?.batchDraw();
      }
    }, [konvaFontStyle, fontFamily, fontSize, fill, align, isEditing]);

    // 3. Auto-Edit on Create
    useEffect(() => {
      if (isNew.current && !isEditing) {
        isNew.current = false;
        if (initialText === "Type something..." || initialText === "Double click to edit") {
             onStartEditing();
        }
      }
    }, [isEditing, onStartEditing, initialText]);

    // 4. Transformer Logic
    useEffect(() => {
      if (isSelected && textRef.current && trRef.current && !isEditing) {
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
      }
    }, [isSelected, isEditing]);

    // 5. Live Transform Logic
    const handleTransform = useCallback(() => {
      const node = textRef.current;
      if (!node) return;
      
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      node.scaleX(1);
      node.scaleY(1);

      const activeAnchor = trRef.current?.getActiveAnchor();
      const isCornerAnchor = activeAnchor && (
        activeAnchor.includes("top") || activeAnchor.includes("bottom")
      );

      if (isCornerAnchor) {
         const newFontSize = Math.max(6, Math.round(node.fontSize() * scaleY));
         const newWidth = Math.max(50, node.width() * scaleX);
         node.fontSize(newFontSize);
         node.width(newWidth);
      } else {
         const newWidth = Math.max(50, node.width() * scaleX);
         node.width(newWidth);
      }
      
      node.getLayer()?.batchDraw();
    }, []);

    const handleTransformEndInternal = useCallback((e: Konva.KonvaEventObject<Event>) => {
      const node = textRef.current;
      if (!node) return;
      onUpdate({
        x: node.x(),
        y: node.y(),
        width: node.width(),
        fontSize: node.fontSize(),
        rotation: node.rotation(),
      });
      if (onTransformEnd) onTransformEnd(e);
    }, [onUpdate, onTransformEnd]);

    // 6. Generic Click Handlers
    const handleClick = useCallback((e: KonvaPointerEvent) => {
      e.cancelBubble = true;
      if (activeTool === "select" && !isEditing) onSelect();
    }, [activeTool, isEditing, onSelect]);

    const handleDblClick = useCallback((e: KonvaPointerEvent) => {
      e.cancelBubble = true;
      if (!isEditing) onStartEditing();
    }, [isEditing, onStartEditing]);

    // 7. Manual Textarea Overlay
    useEffect(() => {
      if (!isEditing || !textRef.current) return;

      const node = textRef.current;
      const stage = node.getStage();
      if (!stage) return;

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      const updateTextareaPos = () => {
        if (!textarea) return;
        const textPosition = node.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        const areaPosition = {
          x: stageBox.left + textPosition.x,
          y: stageBox.top + textPosition.y,
        };
        const absScale = node.getAbsoluteScale();

        textarea.value = node.text();
        
        Object.assign(textarea.style, {
          position: "fixed",
          top: `${areaPosition.y}px`,
          left: `${areaPosition.x}px`,
          width: `${node.width() * absScale.x}px`,
          minHeight: `${node.height() * absScale.y}px`,
          fontSize: `${node.fontSize() * absScale.y}px`,
          fontFamily: node.fontFamily(),
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          textAlign: node.align(),
          color: node.fill(),
          lineHeight: "1.4",
          border: "none",
          padding: "0px",
          margin: "0px",
          overflow: "hidden",
          background: "none",
          outline: "none",
          resize: "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          transformOrigin: "left top",
          transform: `rotateZ(${node.rotation()}deg)`,
          zIndex: "10000",
        });
        
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      updateTextareaPos();
      textarea.focus();

      const removeTextarea = () => {
        if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
      };

      const handleOutsideClick = (e: MouseEvent) => {
        if (e.target !== textarea) onFinishEditing();
      };

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onFinishEditing();
      };

      const handleInput = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
        onUpdate({ text: textarea.value });
      };

      textarea.addEventListener("keydown", handleKeydown);
      textarea.addEventListener("input", handleInput);
      
      setTimeout(() => window.addEventListener("click", handleOutsideClick), 0);

      return () => {
        removeTextarea();
        window.removeEventListener("click", handleOutsideClick);
      };
    }, [isEditing, onFinishEditing, onUpdate, fontSize, fontFamily, fontWeight, fontStyle, fill, align]);

    return (
      <>
        {/* Render Konva Text */}
        <KonvaText
          ref={textRef}
          id={id}
          x={x}
          y={y}
          text={initialText || "Double click to edit"}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={konvaFontStyle}
          fill={isEditing ? "transparent" : fill}
          align={align}
          width={width}
          wrap="word"
          lineHeight={1.4}
          rotation={rotation}
          draggable={!isEditing && isSelected}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEndInternal}
          onClick={handleClick}
          onTap={handleClick}
          onDblClick={handleDblClick}
          onDblTap={handleDblClick}
        />

        {/* Transformer - FIXED: Removed redundant 'node' prop */}
        {isSelected && !isEditing && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              newBox.width = Math.max(50, newBox.width);
              return newBox;
            }}
            enabledAnchors={[
              "top-left", "top-right", "bottom-left", "bottom-right",
              "middle-left", "middle-right"
            ]}
            rotateEnabled={true}
            keepRatio={false}
          />
        )}
      </>
    );
  }
);

TextComponent.displayName = "TextComponent";
export default TextComponent;