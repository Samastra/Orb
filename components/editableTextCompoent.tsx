"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Text, Transformer } from "react-konva";
import TextEditor from "@/components/TextEditor";
import Konva from "konva";

// ------------------
// Type definitions
// ------------------
interface TextAttributes {
  x?: number;
  y?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  width?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface EditableTextComponentProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (attrs: TextAttributes) => void;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  width? :number;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// ------------------
// Inner component
// ------------------
const EditableTextComponentInner: React.FC<
   EditableTextComponentProps & { textRef: React.RefObject<Konva.Text | null>  }
> = ({
  id,
  x,
  y,
  text,
  fontSize,
  fill,
  isSelected,
  activeTool,
  onSelect,
  onUpdate,
  fontFamily = "Arial",
  fontWeight = "normal",
  fontStyle = "normal",
  textDecoration = "none",
  align = "left",
  letterSpacing = 0,
  lineHeight = 1.2,
  textTransform = "none",
  textShadow,
  textRef,
}) => {
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(text === "");
  const [textWidth, setTextWidth] = useState(200);

  // Helper for text transform
  const getTransformedText = useCallback((txt: string, transform: string) => {
    switch (transform) {
      case "uppercase":
        return txt.toUpperCase();
      case "lowercase":
        return txt.toLowerCase();
      case "capitalize":
        return txt.replace(/\b\w/g, (c) => c.toUpperCase());
      default:
        return txt;
    }
  }, []);

  // Re-render when style changes
  useEffect(() => {
    if (textRef.current) {
      textRef.current.getLayer()?.batchDraw();
    }
  }, [fontFamily, fontWeight, fontStyle, textDecoration, align, letterSpacing, lineHeight, textTransform, textShadow]);

  // Apply shadow blur
  useEffect(() => {
    if (textRef.current && textShadow && textShadow.blur > 0) {
      textRef.current.cache();
    }
  }, [textShadow]);

  // Cursor control
  useEffect(() => {
    if (textRef.current) {
      const stage = textRef.current.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = activeTool === "text" ? "text" : "default";
      }
    }
  }, [activeTool]);

  // Transformer binding
  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [isSelected, isEditing]);

  const handleTextDblClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextChange = useCallback(
    (newText: string) => {
      onUpdate({ text: newText });
    },
    [onUpdate]
  );

  const handleTransformEnd = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const activeAnchor = trRef.current?.getActiveAnchor();

    let newWidth = textWidth;
    let newFontSize = fontSize;

    if (
      activeAnchor?.includes("top-left") ||
      activeAnchor?.includes("top-right") ||
      activeAnchor?.includes("bottom-left") ||
      activeAnchor?.includes("bottom-right")
    ) {
      const uniformScale = (scaleX + scaleY) / 2;
      newFontSize = Math.max(5, Math.round(fontSize * uniformScale));
      newWidth = Math.max(30, Math.round(textWidth * uniformScale));
      setTextWidth(newWidth);
    } else if (activeAnchor === "middle-left" || activeAnchor === "middle-right") {
      newWidth = Math.max(30, Math.round(textWidth * scaleX));
      setTextWidth(newWidth);
    } else if (activeAnchor === "middle-top" || activeAnchor === "middle-bottom") {
      newFontSize = Math.max(5, Math.round(fontSize * scaleY));
    }

    node.scaleX(1);
    node.scaleY(1);

    onUpdate({
      width: newWidth,
      fontSize: newFontSize,
      x: node.x(),
      y: node.y(),
    });
  }, [onUpdate, textWidth, fontSize]);

  // Optional: preload fonts to prevent flicker
  const loadFont = useCallback((family: string, weight: string) => {
    const font = new FontFace(family, "", { weight, style: "normal" });
    font
      .load()
      .then(() => document.fonts.add(font))
      .catch((err) => console.warn(`Font load failed: ${family} ${weight}`, err));
  }, []);

  useEffect(() => {
    if (fontFamily && fontWeight) loadFont(fontFamily, fontWeight);
  }, [fontFamily, fontWeight, loadFont]);

  return (
    <>
      <Text
        ref={textRef}
        id={id}
        x={x}
        y={y}
        text={getTransformedText(text, textTransform)}
        fontSize={fontSize}
        fill={fill}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fontVariant="normal"
        fontWeight={fontWeight}
        textDecoration={textDecoration}
        align={align}
        verticalAlign="middle"
        letterSpacing={letterSpacing}
        lineHeight={lineHeight}
        shadowColor={textShadow?.color || "transparent"}
        shadowBlur={textShadow?.blur || 0}
        shadowOffsetX={textShadow?.offsetX || 0}
        shadowOffsetY={textShadow?.offsetY || 0}
        shadowOpacity={1}
        shadowEnabled={!!textShadow && textShadow.blur > 0}
        perfectDrawEnabled={false}
        draggable
        width={textWidth}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onUpdate({ x: e.target.x(), y: e.target.y() });
        }}
        onTransform={handleTransformEnd}
        visible={!isEditing}
      />

      {isEditing && textRef.current && (
        <TextEditor
          textNode={textRef.current}
          onChange={handleTextChange}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            "middle-left",
            "middle-right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-top",
            "middle-bottom",
          ]}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
            height: Math.max(20, newBox.height),
          })}
          keepRatio={false}
        />
      )}
    </>
  );
};

// ------------------
// ForwardRef Wrapper
// ------------------
const EditableTextComponent = forwardRef<Konva.Text, EditableTextComponentProps>(
  (props, ref) => {
    const internalRef = useRef<Konva.Text>(null);
    useImperativeHandle(ref, () => internalRef.current as Konva.Text);
    return <EditableTextComponentInner {...props} textRef={internalRef} />;
  }
);

EditableTextComponent.displayName = "EditableTextComponent";

export default EditableTextComponent;
