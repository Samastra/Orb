// components/StageComponent.tsx
import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, RegularPolygon } from "react-konva";
import GridLayer from "@/components/gridLayer";
import EditableTextComponent from "@/components/editableTextCompoent";
import { ReactShape, Tool } from "../types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

// Dynamic import for Stage
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), {
  ssr: false,
});

interface StageComponentProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  trRef: React.RefObject<Konva.Transformer | null>;
  scale: number;
  position: { x: number; y: number };
  activeTool: Tool | null;
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>;
  reactShapes: ReactShape[];
  shapes: KonvaShape[];
  selectedNodeId: string | null;
  stageInstance: Konva.Stage | null;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setReactShapes: React.Dispatch<React.SetStateAction<ReactShape[]>>;
  setShapes: React.Dispatch<React.SetStateAction<KonvaShape[]>>;
  updateShape: (id: string, attrs: Partial<KonvaShape>) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
}

const StageComponent: React.FC<StageComponentProps> = ({
  stageRef,
  trRef,
  scale,
  position,
  activeTool,
  lines,
  reactShapes,
  shapes,
  selectedNodeId,
  stageInstance,
  handleWheel,
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  setSelectedNodeId,
  setReactShapes,
  setShapes,
  updateShape,
  setStageInstance,
}) => {
  // Create refs for all shapes (both Konva shapes and React shapes)
  const shapeRefs = useRef<{ [key: string]: any }>({});

  // Sync shape refs when shape lists change
  useEffect(() => {
    const allIds = [
      ...shapes.map(s => s.id),
      ...reactShapes.map(r => r.id)
    ];
    const map: { [key: string]: any } = {};
    allIds.forEach(id => {
      map[id] = shapeRefs.current[id] || React.createRef();
    });
    shapeRefs.current = map;
  }, [shapes, reactShapes]);

  // FIXED: Sort combined array by zIndex for proper layering
  const combined = React.useMemo(() => {
    // Combine all shapes and sort by zIndex for proper layering
    const allShapes = [
      ...shapes.map(s => ({ ...s, __kind: 'konva' as const })),
      ...reactShapes.map(r => ({ ...r, __kind: 'react' as const }))
    ];
    
    // Sort by zIndex - higher zIndex renders on top
    return allShapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [shapes, reactShapes]);

  useEffect(() => {
    if (!trRef.current) return;
    if (!selectedNodeId) {
      trRef.current.nodes([]);
      return;
    }
    const ref = shapeRefs.current[selectedNodeId];
    const selectedShape = combined.find(item => item.id === selectedNodeId);
    if (selectedShape && selectedShape.__kind === 'react' && selectedShape.type === 'stickyNote') {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }
    if (ref && ref.current) {
      trRef.current.nodes([ref.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedNodeId, combined, trRef]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedNodeId(null);
      return;
    }
    if (e.target.hasName('selectable-shape')) {
      setSelectedNodeId(e.target.id());
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <Stage
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        ref={(node) => {
          if (node) {
            stageRef.current = node;
            setStageInstance(node);
          }
        }}
        className="bg-white cursor-move"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        draggable={activeTool === "select"}
      >
        <GridLayer stage={stageInstance} baseSize={30} color="#d6d4d4ff" />
        <Layer name="draw-layer">
          {combined.map((item: any) => {
            const id = item.id;
            const commonProps = {
              id,
              x: item.x,
              y: item.y,
              draggable: item.draggable ?? true,
              name: 'selectable-shape',
              onDragEnd: (e: any) => {
                if (item.__kind === 'konva') {
                  updateShape(id, { x: e.target.x(), y: e.target.y() });
                } else {
                  setReactShapes(prev => prev.map(s => s.id === id ? { ...s, x: e.target.x(), y: e.target.y() } : s));
                }
              },
              onClick: (e: any) => {
                e.cancelBubble = true;
                if (activeTool === "select") {
                  setSelectedNodeId(id);
                }
              },
              onTap: (e: any) => {
                e.cancelBubble = true;
                if (activeTool === "select") {
                  setSelectedNodeId(id);
                }
              }
            };

            if (item.__kind === 'konva') {
              switch (item.type) {
                case 'rect':
                  return (
                    <Rect
                      key={id}
                      ref={shapeRefs.current[id]}
                      {...commonProps}
                      width={item.width || 100}
                      height={item.height || 100}
                      fill={item.fill}
                    />
                  );
                case 'circle':
                  return (
                    <Circle
                      key={id}
                      ref={shapeRefs.current[id]}
                      {...commonProps}
                      radius={item.radius || 50}
                      fill={item.fill}
                    />
                  );
                case 'ellipse':
                  return (
                    <Ellipse
                      key={id}
                      ref={shapeRefs.current[id]}
                      {...commonProps}
                      radiusX={item.radiusX || 80}
                      radiusY={item.radiusY || 50}
                      fill={item.fill}
                    />
                  );
                case 'triangle':
                  return (
                    <RegularPolygon
                      key={id}
                      ref={shapeRefs.current[id]}
                      {...commonProps}
                      sides={3}
                      radius={50}
                      fill={item.fill}
                    />
                  );
                case 'arrow':
                  return (
                    <Arrow
                      key={id}
                      ref={shapeRefs.current[id]}
                      {...commonProps}
                      points={item.points || [0, 0, 100, 0]}
                      stroke={item.fill}
                      fill={item.fill}
                      strokeWidth={2}
                      pointerLength={10}
                      pointerWidth={10}
                    />
                  );
                default:
                  return null;
              }
            } else {
              if (item.type === 'text') {
                return (
                  <EditableTextComponent
                    key={id}
                    ref={shapeRefs.current[id]}
                    id={id}
                    x={item.x}
                    y={item.y}
                    text={item.text || "Double click to edit"}
                    fontSize={item.fontSize || 20}
                    fill={item.fill || "black"}
                    fontFamily={item.fontFamily || "Arial"}
                    fontWeight={item.fontWeight || "normal"}
                    fontStyle={item.fontStyle || "normal"}
                    textDecoration={item.textDecoration || "none"}
                    align={item.align || "left"}
                    letterSpacing={item.letterSpacing || 0}
                    lineHeight={item.lineHeight || 1.2}
                    textTransform={item.textTransform || "none"}
                    textShadow={item.textShadow}
                    isSelected={selectedNodeId === id}
                    activeTool={activeTool}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeId(id);
                      }
                    }}
                    onUpdate={(newAttrs: any) => {
                      setReactShapes(prev => prev.map(shape => shape.id === id ? { ...shape, ...newAttrs } : shape));
                    }}
                  />
                );
              } else if (item.type === 'stickyNote') {
                return (
                  <EditableStickyNoteComponent
                    key={id}
                    ref={shapeRefs.current[id]}
                    shapeData={item}
                    isSelected={selectedNodeId === id}
                    activeTool={activeTool}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeId(id);
                      }
                    }}
                    onUpdate={(newAttrs: any) => {
                      setReactShapes(prev => prev.map(shape => shape.id === id ? { ...shape, ...newAttrs } : shape));
                    }}
                  />
                );
              } else {
                return null;
              }
            }
          })}

          {/* Lines - keep on top of items in the same layer */}
          {lines.map((line, i) => (
            <Line
              key={`line-${i}`}
              points={line.points}
              stroke={line.tool === 'brush' ? '#000000' : '#ffffff'}
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
              listening={false}
            />
          ))}

          {/* Transformer */}
          <Transformer
            ref={trRef}
            enabledAnchors={[
              "top-left", "top-right",
              "bottom-left", "bottom-right",
              "top-center", "bottom-center",
              "middle-left", "middle-right"
            ]}
            boundBoxFunc={(oldBox, newBox) => ({
              ...newBox,
              width: Math.max(20, newBox.width),
              height: Math.max(20, newBox.height),
            })}
            keepRatio={false}
            rotateEnabled={true}
            resizeEnabled={true}
            anchorSize={10}
            anchorStrokeWidth={1}
            borderStroke="#0099e5"
            borderStrokeWidth={2}
            anchorCornerRadius={4}
            anchorStroke="#0099e5"
            anchorFill="#ffffff"
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default StageComponent;