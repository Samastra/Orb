// UPDATED FigmaTextComponent with improved editing
"use client";

import React, { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Text, Transformer, Group, Rect } from "react-konva";
import Konva from "konva";

export interface FigmaTextProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (attrs: any) => void;
  onStartEditing: () => void;
  onFinishEditing: (newText?: string) => void;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
}

const FigmaTextComponent = forwardRef<Konva.Group, FigmaTextProps>(
  (props, ref) => {
    const {
      id,
      x,
      y,
      text,
      fontSize,
      fill,
      isSelected,
      isEditing,
      onSelect,
      onUpdate,
      onStartEditing,
      onFinishEditing,
      fontFamily = "Inter, Arial, sans-serif",
      fontWeight = "400",
      fontStyle = "normal",
      align = "left",
    } = props;

    const groupRef = useRef<Konva.Group>(null);
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const editDivRef = useRef<HTMLDivElement | null>(null);

    const [textWidth, setTextWidth] = useState(100);
    const [textHeight, setTextHeight] = useState(fontSize * 1.2);
    const [isTransforming, setIsTransforming] = useState(false);

    // Calculate text dimensions
    // REPLACE the updateTextDimensions function (around line 45):
            const updateTextDimensions = useCallback(() => {
            const textNode = textRef.current;
            if (!textNode) return;

            requestAnimationFrame(() => {
                // Use Konva's built-in measurement with proper settings
                textNode.width(undefined); // Reset width to auto-calculate
                const naturalWidth = textNode.getTextWidth();
                const naturalHeight = textNode.getTextHeight();
                
                // Add generous padding and set minimum sizes
                const width = Math.max(50, naturalWidth + 30);
                const height = Math.max(fontSize + 10, naturalHeight + 20);
                
                setTextWidth(width);
                setTextHeight(height);
                
                // Force Konva to recalculate
                textNode.width(width);
                textNode.height(height);
                textNode.getLayer()?.batchDraw();
            });
            }, [fontSize]);

    // Direct canvas editing with improved positioning
    useEffect(() => {
      if (isEditing && isSelected) {
        startDirectEditing();
      } else {
        cleanupDirectEditing();
      }

      return cleanupDirectEditing;
    }, [isEditing, isSelected]);

    const startDirectEditing = () => {
      const textNode = textRef.current;
      const stage = textNode?.getStage();
      if (!textNode || !stage) return;

      cleanupDirectEditing(); // Cleanup any existing

      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.innerText = text;
      
      // Style for natural editing experience
      const absPos = textNode.absolutePosition();
      const stageContainer = stage.container();
      const stageRect = stageContainer.getBoundingClientRect();
      
      div.style.position = 'absolute';
      div.style.left = `${stageRect.left + absPos.x - 10}px`; // Account for padding
      div.style.top = `${stageRect.top + absPos.y - 5}px`;
      div.style.width = `${textWidth}px`;
      div.style.minHeight = `${textHeight}px`;
      div.style.fontSize = `${fontSize}px`;
      div.style.fontFamily = fontFamily;
      div.style.fontWeight = fontWeight;
      div.style.fontStyle = fontStyle;
      div.style.color = fill;
      div.style.background = 'transparent';
      div.style.border = '2px solid #0099e5';
      div.style.borderRadius = '4px';
      div.style.outline = 'none';
      div.style.padding = '8px 12px';
      div.style.zIndex = '1000';
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      div.style.lineHeight = '1.4';
      div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      div.style.overflow = 'hidden';
      div.style.resize = 'none';

      stageContainer.appendChild(div);
      editDivRef.current = div;
      
      div.focus();
      placeCaretAtEnd(div);

      // Enhanced event handlers
      const handleInput = () => {
        const newText = div.innerText;
        onUpdate({ text: newText });
        
        // Auto-resize div as user types
        requestAnimationFrame(() => {
          div.style.width = 'auto';
          div.style.width = `${div.scrollWidth}px`;
          div.style.height = 'auto'; 
          div.style.height = `${div.scrollHeight}px`;
        });
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onFinishEditing(div.innerText);
        } else if (e.key === 'Escape') {
          onFinishEditing(); // Cancel editing
        }
      };

     const handleBlur = () => {
            // Give a small delay to ensure text is updated
            setTimeout(() => {
                onFinishEditing(div.innerText);
            }, 10);
            };

      div.addEventListener('input', handleInput);
      div.addEventListener('keydown', handleKeyDown);
      div.addEventListener('blur', handleBlur);
    };

    const cleanupDirectEditing = () => {
      if (editDivRef.current) {
        editDivRef.current.removeEventListener('input', () => {});
        editDivRef.current.removeEventListener('keydown', () => {});
        editDivRef.current.removeEventListener('blur', () => {});
        editDivRef.current.remove();
        editDivRef.current = null;
      }
    };

    const placeCaretAtEnd = (el: HTMLElement) => {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    // Update dimensions when text changes
    useEffect(() => {
      if (!isEditing && !isTransforming) {
        updateTextDimensions();
      }
    }, [text, fontSize, fontFamily, fontWeight, fontStyle, isEditing, isTransforming, updateTextDimensions]);

    // Transformer setup
    useEffect(() => {
      if (isSelected && trRef.current && groupRef.current && !isEditing) {
        trRef.current.nodes([groupRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
      }
    }, [isSelected, isEditing]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      onUpdate({ x: e.target.x(), y: e.target.y() });
    }, [onUpdate]);

    // REPLACE the handleTransformEnd function (around line 150):
            const handleTransformEnd = useCallback(() => {
                const group = groupRef.current;
                const textNode = textRef.current;
                const transformer = trRef.current;
                
                if (!group || !textNode || !transformer) return;

                const activeAnchor = transformer.getActiveAnchor();
                const scaleX = group.scaleX();
                const scaleY = group.scaleY();

                let newWidth = textWidth;
                let newFontSize = fontSize;

                // DETECT ANCHOR TYPE
                const isSideAnchor = activeAnchor?.includes('middle-left') || activeAnchor?.includes('middle-right');

                if (isSideAnchor) {
                    // SIDE ANCHORS: Change width only, reflow text (font size unchanged)
                    newWidth = Math.max(50, textWidth * scaleX);
                    newFontSize = fontSize; // Keep original font size
                    console.log('🔄 Side transform - Width:', newWidth, 'Font size unchanged:', newFontSize);
                } else {
                    // CORNER ANCHORS: Scale everything proportionally
                    const uniformScale = Math.min(scaleX, scaleY);
                    newWidth = Math.max(50, textWidth * uniformScale);
                    newFontSize = Math.max(8, fontSize * uniformScale);
                    console.log('🔄 Corner transform - Width:', newWidth, 'Font size:', newFontSize, 'Scale:', uniformScale);
                }

                // Reset scale
                group.scaleX(1);
                group.scaleY(1);

                // Update state
                setTextWidth(newWidth);
                
                onUpdate({
                    x: group.x(),
                    y: group.y(),
                    width: newWidth,
                    fontSize: newFontSize,
                    rotation: group.rotation(),
                });

                setIsTransforming(false);
                
                // Force text to reflow with new dimensions
                setTimeout(() => {
                    updateTextDimensions();
                    textNode.getLayer()?.batchDraw();
                }, 50);
                }, [textWidth, fontSize, onUpdate, updateTextDimensions]);

    const handleDblClick = useCallback(() => {
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
      draggable={!isEditing}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Optional: Background for better visibility */}
      <Rect
        width={textWidth}
        height={textHeight}
        fill="transparent"
        stroke={isSelected ? "#0099e5" : "transparent"}
        strokeWidth={isSelected ? 1 : 0}
        cornerRadius={4}
      />
      
      <Text
        ref={textRef}
        text={text}
        fontSize={fontSize}
        fill={fill}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fontWeight={fontWeight}
        align={align}
        width={textWidth}
        height={textHeight}
        perfectDrawEnabled={false}
        listening={!isEditing}
        wrap="word"
        padding={10}
        lineHeight={1.2}
      />
    </Group>

    {/* MOVE TRANSFORMER OUTSIDE THE GROUP */}
    {isSelected && !isEditing && (
            <Transformer
                ref={trRef}
                enabledAnchors={[
                "top-left", "top-right", 
                "bottom-left", "bottom-right",
                "middle-left", "middle-right"
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                const transformer = trRef.current;
                const activeAnchor = transformer?.getActiveAnchor();
                
                const isSideAnchor = activeAnchor?.includes('middle-left') || activeAnchor?.includes('middle-right');
                
                if (isSideAnchor) {
                    // For side anchors: only change width, keep height for text reflow
                    return {
                    ...newBox,
                    width: Math.max(50, newBox.width),
                    height: oldBox.height, // Keep original height - text will reflow within this width
                    };
                }
                
                // For corner anchors: allow proportional scaling with minimums
                return {
                    ...newBox,
                    width: Math.max(50, newBox.width),
                    height: Math.max(fontSize + 10, newBox.height),
                };
                }}
                keepRatio={false}
                rotateEnabled={true}
                onTransform={() => setIsTransforming(true)}
                onTransformEnd={handleTransformEnd}
            />
            )}
  </>
);
  }
);

FigmaTextComponent.displayName = "FigmaTextComponent";
export default FigmaTextComponent;