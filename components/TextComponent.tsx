// components/TextComponent.tsx
"use client";
import React, { useRef, useEffect, useCallback, forwardRef } from "react";
import { Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";

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
      onStartEditing,
      onFinishEditing,
    }
  ) => {
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const isNew = useRef(true);

    // **FIX: Compute combined fontStyle for Konva (merges weight and style)**
    const konvaFontStyle = (() => {
      const stylePart = fontStyle === "normal" ? "" : fontStyle;
      const weightPart =
        fontWeight === "400" || fontWeight === "normal"
          ? ""
          : fontWeight === "bold"
          ? "bold"
          : fontWeight; // Use numeric like '700' directly
      return `${stylePart} ${weightPart}`.trim() || "normal";
    })();

    // **CRITICAL FIX: Force Konva to update when font properties change**
    useEffect(() => {
      if (textRef.current && !isEditing) {
        const node = textRef.current;
        
        // Update the Konva node using setAttrs (the correct way)
        node.setAttrs({
          fontFamily,
          fontStyle: konvaFontStyle, // Use combined style
          fontSize,
          fill,
          align
        });
        
        // Clear cache if any (safe even if not cached)
        node.clearCache();
        
        // Force a redraw of the entire layer
        const layer = node.getLayer();
        if (layer) {
          layer.batchDraw();
          console.log('🔄 Force redraw for font properties:', { konvaFontStyle, fontFamily });
        }
      }
    }, [konvaFontStyle, fontFamily, fontSize, fill, align, isEditing]); // Depend on konvaFontStyle instead of separate fontWeight/fontStyle

    // **AUTO-EDIT ON CREATE**
    useEffect(() => {
      if (isNew.current && !isEditing) {
        isNew.current = false;
        onStartEditing();
      }
    }, [isEditing, onStartEditing]);

    // **TRANSFORMER**
    useEffect(() => {
      if (isSelected && textRef.current && trRef.current && !isEditing) {
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
      }
    }, [isSelected, isEditing]);

    // **LIVE WIDTH UPDATE ON TRANSFORM (NO STRETCH!)**
    const handleTransform = useCallback(() => {
      const node = textRef.current;
      const transformer = trRef.current;
      if (!node || !transformer) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const activeAnchor = transformer.getActiveAnchor();
      const isCornerAnchor =
        activeAnchor &&
        (activeAnchor.includes("top") || activeAnchor.includes("bottom")) &&
        (activeAnchor.includes("left") || activeAnchor.includes("right"));
      if (isCornerAnchor) {
        const oldFontSize = node.fontSize();
        const oldWidth = node.width();
        const newFontSize = Math.max(6, Math.round(oldFontSize * scaleY));
        const newWidth = Math.max(50, oldWidth * scaleX);
        node.fontSize(newFontSize);
        node.width(newWidth);
        node.scaleX(1);
        node.scaleY(1);
      } else {
        const newWidth = Math.max(50, node.width() * scaleX);
        node.width(newWidth);
        node.scaleX(1);
        node.scaleY(1);
      }
      node.getLayer()?.batchDraw();
    }, []);

    // **TRANSFORM END — UPDATE STATE**
    const handleTransformEnd = useCallback(() => {
      const node = textRef.current;
      if (!node) return;
      onUpdate({
        x: node.x(),
        y: node.y(),
        width: node.width(),
        fontSize: node.fontSize(),
        rotation: node.rotation(),
      });
    }, [onUpdate]);

    // **DRAG END**
    const handleDragEnd = useCallback(
      (e: KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onUpdate({ x: node.x(), y: node.y() });
      },
      [onUpdate]
    );

    // **CLICK → SELECT**
    const handleClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (activeTool === "select" && !isEditing) onSelect();
      },
      [activeTool, isEditing, onSelect]
    );

    // **DOUBLE-CLICK → EDIT**
    const handleDblClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (!isEditing) onStartEditing();
      },
      [isEditing, onStartEditing]
    );

    // **INLINE EDITOR**
    useEffect(() => {
      if (!isEditing || !textRef.current) return;
      const node = textRef.current;
      const stage = node.getStage();
      if (!stage) return;
      const editor = document.createElement("div");
      editorRef.current = editor;
      document.body.appendChild(editor);
      const { x: absX, y: absY } = node.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      Object.assign(editor.style, {
        position: "fixed",
        left: `${stageBox.left + absX}px`,
        top: `${stageBox.top + absY}px`,
        width: `${node.width()}px`,
        minHeight: `${fontSize * 1.4}px`,
        fontSize: `${fontSize}px`,
        fontFamily,
        fontWeight, // Keep separate for CSS
        fontStyle, // Keep separate for CSS
        color: fill,
        textAlign: align,
        lineHeight: "1.4",
        padding: "0",
        margin: "0",
        border: "none",
        outline: "none",
        background: "transparent",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        cursor: "text",
        zIndex: "10000",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "top left",
      });
      editor.contentEditable = "true";
      editor.innerHTML = initialText || "";
      const resize = () => {
        editor.style.height = "auto";
        editor.style.height = `${editor.scrollHeight}px`;
      };
      const handleInput = () => resize();
      const handleBlur = () => {
        const newText = editor.innerHTML;
        
        onUpdate({
          text: newText,
          fontWeight,
          fontFamily,
          fontSize,
          fontStyle,
          fill,
          align
        });
        
        const tempText = new Konva.Text({ text: newText, fontSize, fontFamily });
        const minWidth = tempText.width() + 20;
        onUpdate({ width: Math.max(node.width(), minWidth) });
        onFinishEditing();
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          editor.blur();
        }
        if (e.key === "Escape") editor.blur();
      };
      editor.addEventListener("input", handleInput);
      editor.addEventListener("blur", handleBlur);
      editor.addEventListener("keydown", handleKeyDown);
      resize();
      setTimeout(() => editor.focus(), 0);
      return () => {
        editor.removeEventListener("input", handleInput);
        editor.removeEventListener("blur", handleBlur);
        editor.removeEventListener("keydown", handleKeyDown);
        if (document.body.contains(editor)) {
          document.body.removeChild(editor);
        }
      };
    }, [
      isEditing,
      initialText,
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

    return (
      <>
        <KonvaText
          ref={textRef}
          id={id}
          x={x}
          y={y}
          text={initialText || "Click to edit"}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={konvaFontStyle} // Use combined for Konva
          fill={fill}
          align={align}
          width={width}
          wrap="word"
          lineHeight={1.4}
          rotation={rotation}
          draggable={!isEditing}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          onClick={handleClick}
          onTap={handleClick}
          onDblClick={handleDblClick}
          onDblTap={handleDblClick}
          visible={!isEditing}
        />
        {isSelected && !isEditing && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              newBox.width = Math.max(50, newBox.width);
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
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