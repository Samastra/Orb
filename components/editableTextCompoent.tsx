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
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
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
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width = textNode.width() - textNode.padding() * 2 + "px";
    textarea.style.minHeight = textNode.height() - textNode.padding() * 2 + "px";
    textarea.style.fontSize = textNode.fontSize() + "px";
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = fontWeight;
    textarea.style.color = typeof textNode.fill() === "string" ? (textNode.fill() as string) : "#000";
    textarea.style.border = "2px solid #0099e5";
    textarea.style.padding = "4px 8px";
    textarea.style.margin = "0";
    textarea.style.background = "transparent"; // Slightly transparent white
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.textAlign = textNode.align();
    textarea.style.zIndex = "1000";
    textarea.style.borderRadius = "4px";
    textarea.style.boxSizing = "border-box";
    textarea.style.backdropFilter = "blur(0.5px)"; // Very subtle blur

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

  // Fixed transformation logic
  const handleTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const activeAnchor = trRef.current?.getActiveAnchor() || "";
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    let newWidth = textWidth;
    let newFontSize = fontSize;

    // Store original values before transformation
    const originalWidth = textWidth;
    const originalFontSize = fontSize;

    if (activeAnchor.includes("middle-left") || activeAnchor.includes("middle-right")) {
      // Side anchors: Only adjust text box width
      newWidth = Math.max(30, Math.round(originalWidth * scaleX));
      newFontSize = originalFontSize; // Keep font size same
    } 
    else if (activeAnchor.includes("middle-top") || activeAnchor.includes("middle-bottom")) {
      // Top/bottom anchors: Only adjust font size vertically
      newWidth = originalWidth; // Keep width same
      newFontSize = Math.max(5, Math.round(originalFontSize * scaleY));
    }
    else {
      // Corner anchors: Scale proportionally
      const uniformScale = (scaleX + scaleY) / 2;
      newFontSize = Math.max(5, Math.round(originalFontSize * uniformScale));
      newWidth = Math.max(30, Math.round(originalWidth * uniformScale));
    }

    // Update the node properties immediately for visual feedback
    node.width(newWidth);
    node.fontSize(newFontSize);
    
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    // Update state
    setTextWidth(newWidth);
  }, [textRef, textWidth, fontSize]);

  const handleTransformEnd = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    onUpdate({
      x: node.x(),
      y: node.y(),
      width: textWidth,
      fontSize: node.fontSize(),
    });
  }, [onUpdate, textRef, textWidth]);

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
            "middle-top",
            "middle-bottom",
          ]}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
            height: Math.max(20, newBox.height),
          })}
          keepRatio={false}
          rotateEnabled={true}
          resizeEnabled={true}
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