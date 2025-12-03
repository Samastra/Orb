// components/TextComponent.tsx
"use client";
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Text as KonvaText } from "react-konva";
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
  height?: number; 
  rotation?: number;
  isSelected: boolean;
  isEditing: boolean;
  activeTool: string | null;
  name?: string; 
  draggable?: boolean;
  
  onSelect: () => void;
  onUpdate: (attrs: any) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onDelete: (id: string) => void;
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
      height, 
      rotation = 0,
      isSelected,
      isEditing,
      activeTool,
      name,
      draggable,
      onSelect,
      onUpdate,
      onDragStart,
      onDragMove,
      onDragEnd,
      onTransformEnd,
      onStartEditing,
      onFinishEditing,
      onDelete,
    },
    ref
  ) => {
    const internalRef = useRef<Konva.Text>(null);

    // FIX: Removed '!' assertion. We cast to Konva.Text to satisfy TS, 
    // but at runtime if it's null, it just passes null to the parent ref callback (which handles it safely).
    useImperativeHandle(ref, () => internalRef.current as Konva.Text);

    const onUpdateRef = useRef(onUpdate);
    const onFinishEditingRef = useRef(onFinishEditing);
    const onDeleteRef = useRef(onDelete);
    
    useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
    useEffect(() => { onFinishEditingRef.current = onFinishEditing; }, [onFinishEditing]);
    useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);

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

    // 1. TRANSFORM LOGIC
    const handleTransform = useCallback(() => {
      const node = internalRef.current;
      const tr = node?.getStage()?.findOne('Transformer') as Konva.Transformer;
      
      if (!node || !tr) return;

      const anchor = tr.getActiveAnchor();

      if (anchor && ['middle-left', 'middle-right'].includes(anchor)) {
         const scaleX = node.scaleX();
         const newWidth = Math.max(50, node.width() * scaleX);
         node.width(newWidth);
         node.scaleX(1);
         node.scaleY(1);
      }
    }, []);

    // 2. TRANSFORM END LOGIC
    const handleTransformEndInternal = useCallback((e: Konva.KonvaEventObject<Event>) => {
      const node = internalRef.current;
      if (!node) return;
      
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      const newWidth = Math.max(50, node.width() * scaleX);
      const newFontSize = Math.max(5, node.fontSize() * scaleY);
      
      node.width(newWidth);
      node.fontSize(newFontSize);
      
      (node as any).height(undefined); 
      
      const newHeight = node.height();

      onUpdateRef.current({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: newWidth,
        height: newHeight, 
        fontSize: newFontSize, 
      });
      
      if (onTransformEnd) onTransformEnd(e);
    }, [onTransformEnd]);

    // --- EDITING LOGIC ---
    useEffect(() => {
      if (!isEditing || !internalRef.current) return;

      const node = internalRef.current;
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

        textarea.value = initialText || ""; 
        
        Object.assign(textarea.style, {
          position: "fixed",
          top: `${areaPosition.y}px`,
          left: `${areaPosition.x}px`,
          width: `${node.width() * absScale.x}px`,
          fontSize: `${node.fontSize() * absScale.y}px`,
          fontFamily: node.fontFamily(),
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          textAlign: node.align(),
          color: fill, 
          lineHeight: node.lineHeight().toString(),
          border: "none",
          padding: "0px",
          margin: "0px",
          overflow: "hidden",
          background: "none",
          outline: "none",
          resize: "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          boxSizing: "border-box", 
          transformOrigin: "left top",
          transform: `rotateZ(${node.rotation()}deg)`,
          zIndex: "10000",
        });
      };

      updateTextareaPos();
      
      const handleResize = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;

        const absScale = node.getAbsoluteScale();
        const newHeight = textarea.scrollHeight / absScale.y;
        
        node.height(newHeight);
        
        const tr = stage.findOne('Transformer') as Konva.Transformer;
        if (tr) {
            tr.forceUpdate();
        }
        node.getLayer()?.batchDraw();
      };

      handleResize();
      textarea.focus();

      const removeTextarea = () => {
        if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
      };

      const handleFinish = () => {
          const val = textarea.value;
          
          const absScale = node.getAbsoluteScale();
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
          
          const buffer = 10; 
          const finalHeight = (textarea.scrollHeight + buffer) / absScale.y;

          onUpdateRef.current({ 
             text: val,
             height: finalHeight 
          });

          if (val.trim() === "") {
            onDeleteRef.current(id);
          } else {
            onFinishEditingRef.current();
          }
      };

      const handleKeydown = (e: KeyboardEvent) => {
        e.stopPropagation(); 
        if (e.key === "Escape") {
            handleFinish();
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); 
            handleFinish();
        }
      };

      const handleBlur = () => {
        handleFinish();
      };

      textarea.addEventListener("keydown", handleKeydown);
      textarea.addEventListener("input", handleResize);
      textarea.addEventListener("blur", handleBlur);

      return () => {
        removeTextarea();
      };

    }, [
      isEditing, 
      id, 
      fontSize, 
      fontFamily, 
      fontWeight, 
      fontStyle, 
      align, 
      fill
    ]); 

    return (
        <KonvaText
          ref={internalRef}
          id={id}
          name={name} 
          x={x}
          y={y}
          text={isEditing ? "" : (initialText || " ")} 
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={konvaFontStyle}
          fill={fill}
          opacity={isEditing ? 0 : 1}
          align={align}
          width={width}
          height={height} 
          scaleX={1}
          scaleY={1}
          wrap="word"
          lineHeight={1.4}
          rotation={rotation}
          draggable={!isEditing && (draggable ?? true)} 
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEndInternal}
          onClick={(e) => {
            if (activeTool === "select") onSelect();
          }}
          onTap={(e) => {
             if (activeTool === "select") onSelect();
          }}
          onDblClick={(e) => {
             if (!isEditing) onStartEditing();
          }}
          onDblTap={(e) => {
             if (!isEditing) onStartEditing();
          }}
          perfectDrawEnabled={false} 
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0} 
          // FIX: Added safety check for width/height to prevent NaN crashes
          hitFunc={(context, shape) => {
            const w = shape.width() || 0;
            const h = shape.height() || 0;
            context.beginPath();
            context.rect(0, 0, w, h);
            context.closePath();
            context.fillStrokeShape(shape);
          }}
        />
    );
  }
);

TextComponent.displayName = "TextComponent";
export default TextComponent;