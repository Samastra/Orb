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
import Konva from "konva";

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
  align?: "left" | "center" | "right" | "justify";
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  rotation?: number; // Added rotation to fix TS error
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
  align?: "left" | "center" | "right" | "justify";
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  width?: number;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// Inner component
const EditableTextComponentInner: React.FC<
  EditableTextComponentProps & { textRef: React.RefObject<Konva.Text | null> }
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
  fontFamily = "Inter, Arial, sans-serif",
  fontWeight = "400",
  fontStyle = "normal",
  textDecoration = "none",
  align = "left",
  letterSpacing = 0,
  lineHeight = 1.2,
  textTransform = "none",
  textShadow,
  textRef,
  width,
}) => {
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [textWidth, setTextWidth] = useState(width || 200);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [sideAnchorActive, setSideAnchorActive] = useState(false); // Track side anchor usage

  // Transform text for display
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

  // Reset transform
  const resetTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    node.width(200); // Default width
    node.fontSize(20); // Default font size
    node.rotation(0);
    node.skewX(0);
    node.skewY(0);

    setTextWidth(200);
    onUpdate({ width: 200, fontSize: 20, rotation: 0 });
  }, [onUpdate, textRef]);

  // Detect Shift key for proportional scaling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    setEditValue(text);
  }, [text]);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [isSelected, isEditing, textRef]);

  useEffect(() => {
    if (textRef.current) {
      const stage = textRef.current.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = activeTool === "text" ? "text" : "default";
      }
    }
  }, [activeTool, textRef]);

  // Auto-resize textarea as user types
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Double-click text to edit
  const handleTextDblClick = useCallback(() => {
    const textNode = textRef.current;
    if (!textNode) return;
    const stage = textNode.getStage();
    if (!stage) return;

    setIsEditing(true);

    const absPos = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const areaPosition = {
      x: stageBox.left + absPos.x,
      y: stageBox.top + absPos.y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textareaRef.current = textarea;

    textarea.value = textNode.text() || "";
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.minHeight = `${textNode.height() - textNode.padding() * 2}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = fontWeight;
    textarea.style.color = typeof textNode.fill() === "string" ? (textNode.fill() as string) : "#000";
    textarea.style.border = "2px solid #0099e5";
    textarea.style.padding = "4px 8px";
    textarea.style.margin = "0";
    textarea.style.background = "transparent";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.textAlign = textNode.align();
    textarea.style.zIndex = "1000";
    textarea.style.borderRadius = "4px";
    textarea.style.boxSizing = "border-box";
    textarea.style.backdropFilter = "blur(0.5px)";

    // Auto-resize initially
    autoResizeTextarea(textarea);

    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      window.removeEventListener("click", handleOutsideClick, true);
      textarea.removeEventListener("keydown", handleKey);
      textarea.removeEventListener("input", handleInput);
      if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
      textareaRef.current = null;
      setIsEditing(false);
    };

    const commit = () => {
      onUpdate({ text: textarea.value });
      removeTextarea();
    };

    const cancel = () => {
      removeTextarea();
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target === textarea) return;
      commit();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    };

    const handleInput = (e: Event) => {
      autoResizeTextarea(textarea);
    };

    textarea.addEventListener("keydown", handleKey);
    textarea.addEventListener("input", handleInput);

    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick, true);
    }, 0);
  }, [onUpdate, textRef, fontWeight, autoResizeTextarea]);

  // Figma-like transformation logic
  const handleTransform = useCallback(() => {
    const node = textRef.current;
    const transformer = trRef.current;
    if (!node || !transformer) return;

    const activeAnchor = transformer.getActiveAnchor() || "";
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const originalWidth = textWidth;
    const originalFontSize = fontSize;

    let newWidth = originalWidth;
    let newFontSize = originalFontSize;

    const isSideAnchor = activeAnchor.includes("middle-left") || activeAnchor.includes("middle-right");
    setSideAnchorActive(isSideAnchor); // Update side anchor state

    if (isSideAnchor) {
      // Side anchors: Adjust width only (affects line breaks)
      newWidth = Math.max(30, Math.round(originalWidth * scaleX));
      newFontSize = originalFontSize; // Font size unchanged
    } else {
      // Corner anchors or Shift: Proportional scaling
      const uniformScale = isShiftPressed ? Math.min(scaleX, scaleY) : scaleX; // Use scaleX for consistency
      newWidth = Math.max(30, Math.round(originalWidth * uniformScale));
      newFontSize = Math.max(8, Math.round(originalFontSize * uniformScale));
    }

    // Apply changes without resetting scale during transform
    node.width(newWidth);
    node.fontSize(newFontSize);

    setTextWidth(newWidth);
    node.getLayer()?.batchDraw();
  }, [textRef, textWidth, fontSize, isShiftPressed]);

  const handleTransformEnd = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    // Reset scale to 1 to avoid compounding
    node.scaleX(1);
    node.scaleY(1);

    // Final update with all transformed properties
    onUpdate({
      x: node.x(),
      y: node.y(),
      width: textWidth,
      fontSize: node.fontSize(),
      text,
      fill,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      align,
      rotation: node.rotation(),
    });
  }, [onUpdate, textRef, textWidth, text, fill, fontFamily, fontWeight, fontStyle, textDecoration, align]);

  const handleDragEnd = useCallback(
    (e: any) => {
      if (isEditing) return;
      onUpdate({ x: e.target.x(), y: e.target.y() });
    },
    [onUpdate, isEditing]
  );

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
        textDecoration={textDecoration}
        align={align}
        verticalAlign="middle"
        letterSpacing={letterSpacing}
        lineHeight={lineHeight}
        shadowColor={textShadow?.color || "transparent"}
        shadowBlur={textShadow?.blur || 0}
        shadowOffsetX={textShadow?.offsetX || 0}
        shadowOffsetY={textShadow?.offsetY || 0}
        shadowOpacity={textShadow?.blur ? 1 : 0}
        shadowEnabled={!!textShadow && textShadow.blur > 0}
        perfectDrawEnabled={false}
        draggable={!isEditing}
        width={textWidth}
        wrap="word"
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onClick={() => !isEditing && onSelect()}
        onTap={() => !isEditing && onSelect()}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
      />

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
          ]}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
            height: Math.max(20, newBox.height),
          })}
          keepRatio={!sideAnchorActive} // Use state to control proportionality
          rotateEnabled={true}
          resizeEnabled={true}
          anchorSize={12}
          anchorCornerRadius={6}
          borderStroke="#0099e5"
          borderStrokeWidth={2}
          anchorStroke="#0099e5"
          anchorFill="#ffffff"
          anchorStrokeWidth={1.5}
        />
      )}

      {isSelected && isShiftPressed && (
        <Text
          x={x}
          y={y - 30}
          text="⇧ Proportional Scaling"
          fontSize={12}
          fill="#0099e5"
          fontFamily="Arial"
          listening={false}
        />
      )}
    </>
  );
};

// ForwardRef wrapper
const EditableTextComponent = forwardRef<Konva.Text, EditableTextComponentProps>(
  (props, ref) => {
    const internalRef = useRef<Konva.Text>(null);
    useImperativeHandle(ref, () => internalRef.current as Konva.Text);
    return <EditableTextComponentInner {...props} textRef={internalRef} />;
  }
);

EditableTextComponent.displayName = "EditableTextComponent";
export default EditableTextComponent;