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

// Simple combined shape type
type CombinedShape = 
  | (KonvaShape & { __kind: 'konva' })
  | (ReactShape & { __kind: 'react' });

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
  const shapeRefs = useRef<{ [key: string]: any }>({});

  // Sync shape refs while preserving existing refs to avoid remounts
  useEffect(() => {
    const allIds = [
      ...shapes.map(s => s.id),
      ...reactShapes.map(r => r.id)
    ];
    const map: { [key: string]: any } = { ...shapeRefs.current };
    // ensure refs exist for all current ids, preserve existing refs
    allIds.forEach(id => {
      if (!map[id]) map[id] = React.createRef();
    });
    // remove refs that no longer exist to keep ref map tidy
    Object.keys(map).forEach(k => {
      if (!allIds.includes(k)) delete map[k];
    });
    shapeRefs.current = map;
  }, [shapes, reactShapes]);

  // NEW SIMPLE APPROACH: Combine shapes and render in array order (like study code)
  // The array order determines the z-order (last item = top layer)
  const allShapesToRender = React.useMemo(() => {
    console.log('🔄 StageComponent re-rendering with shapes:', {
      konvaShapes: shapes.length,
      reactShapes: reactShapes.length,
      total: shapes.length + reactShapes.length
    });
    
    // Simple combination - no z-index sorting needed!
    // Array order = render order = z-order
    return [
      ...shapes.map(s => ({ ...s, __kind: 'konva' as const })),
      ...reactShapes.map(s => ({ ...s, __kind: 'react' as const })),
    ];
  }, [shapes, reactShapes]); // This will re-run when shapes arrays change

  // Transformer management
  useEffect(() => {
    if (!trRef.current) {
      return;
    }

    if (!selectedNodeId) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    const ref = shapeRefs.current[selectedNodeId];
    const selectedShape = allShapesToRender.find(item => item.id === selectedNodeId);
    
    // Don't show transformer for sticky notes
    if (selectedShape && selectedShape.__kind === 'react' && selectedShape.type === 'stickyNote') {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }
    
    if (ref?.current) {
      try {
        trRef.current.nodes([ref.current]);
        trRef.current.getLayer()?.batchDraw();
      } catch (err) {
        // defensive: if transformer can't attach because node not yet mounted, clear nodes
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedNodeId, allShapesToRender, trRef]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    if (e.target === stage) {
      setSelectedNodeId(null);
      return;
    }
    
    if (e.target.hasName('selectable-shape')) {
      setSelectedNodeId(e.target.id());
    }
  };

  const handleShapeDragEnd = (item: CombinedShape, e: any) => {
    try {
      const nx = e.target.x();
      const ny = e.target.y();
      if (item.__kind === 'konva') {
        updateShape(item.id, { x: nx, y: ny });
      } else {
        setReactShapes(prev => prev.map(s => 
          s.id === item.id ? { ...s, x: nx, y: ny } : s
        ));
      }
    } catch (error) {
      console.error('Error handling shape drag end:', error);
    }
  };

  const handleShapeClick = (item: CombinedShape, e: any) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      setSelectedNodeId(item.id);
    }
  };

  // Debug: Log when shapes change to verify re-renders
  useEffect(() => {
    console.log('🎨 Shapes updated - rendering:', allShapesToRender.length, 'shapes');
    console.log('📊 Shape breakdown:', {
      konva: shapes.length,
      react: reactShapes.length,
      selected: selectedNodeId
    });
  }, [allShapesToRender.length, shapes.length, reactShapes.length, selectedNodeId]);

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
          {/* SIMPLE RENDERING: Render all shapes in array order (determines z-order) */}
          {allShapesToRender.map((item) => {
            console.log(`🎯 Rendering shape: ${item.id} (${item.__kind}:${item.type})`);

            const commonProps = {
              id: item.id,
              x: item.x,
              y: item.y,
              draggable: item.draggable ?? true,
              name: 'selectable-shape',
              onDragEnd: (e: any) => handleShapeDragEnd(item, e),
              onClick: (e: any) => handleShapeClick(item, e),
              onTap: (e: any) => handleShapeClick(item, e),
            };

            if (item.__kind === 'konva') {
              // Use type assertions for Konva properties
              const konvaItem = item as any;
              
              switch (item.type) {
                case 'rect':
                  return (
                    <Rect
                      key={item.id}
                      ref={shapeRefs.current[item.id]}
                      {...commonProps}
                      width={konvaItem.width ?? 100}
                      height={konvaItem.height ?? 100}
                      fill={konvaItem.fill}
                      cornerRadius={konvaItem.cornerRadius ?? 0}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                    />
                  );
                case 'circle':
                  return (
                    <Circle
                      key={item.id}
                      ref={shapeRefs.current[item.id]}
                      {...commonProps}
                      radius={konvaItem.radius ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                    />
                  );
                case 'ellipse':
                  return (
                    <Ellipse
                      key={item.id}
                      ref={shapeRefs.current[item.id]}
                      {...commonProps}
                      radiusX={konvaItem.radiusX ?? 80}
                      radiusY={konvaItem.radiusY ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                    />
                  );
                case 'triangle':
                  return (
                    <RegularPolygon
                      key={item.id}
                      ref={shapeRefs.current[item.id]}
                      {...commonProps}
                      sides={3}
                      radius={konvaItem.radius ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                    />
                  );
                case 'arrow':
                  return (
                    <Arrow
                      key={item.id}
                      ref={shapeRefs.current[item.id]}
                      {...commonProps}
                      points={(konvaItem.points as number[]) ?? [0, 0, 100, 0]}
                      stroke={konvaItem.fill ?? konvaItem.stroke}
                      fill={konvaItem.fill}
                      strokeWidth={konvaItem.strokeWidth ?? 2}
                      pointerLength={konvaItem.pointerLength ?? 10}
                      pointerWidth={konvaItem.pointerWidth ?? 10}
                    />
                  );
                default:
                  return null;
              }
            } else {
              if (item.type === 'text') {
                const textItem = item as ReactShape;
                return (
                  <EditableTextComponent
                    key={item.id}
                    ref={shapeRefs.current[item.id]}
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    text={textItem.text ?? "Double click to edit"}
                    fontSize={textItem.fontSize ?? 20}
                    fill={textItem.fill ?? "black"}
                    fontFamily={textItem.fontFamily ?? "Arial"}
                    fontWeight={textItem.fontWeight ?? "normal"}
                    fontStyle={textItem.fontStyle ?? "normal"}
                    textDecoration={textItem.textDecoration ?? "none"}
                    align={["left", "center", "right", "justify"].includes((textItem.align ?? "left") as string) ? (textItem.align as "left" | "center" | "right" | "justify") : "left"}
                    letterSpacing={textItem.letterSpacing ?? 0}
                    lineHeight={textItem.lineHeight ?? 1.2}
                    textTransform={textItem.textTransform ?? "none"}
                    textShadow={textItem.textShadow}
                    isSelected={selectedNodeId === item.id}
                    activeTool={activeTool}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeId(item.id);
                      }
                    }}
                    onUpdate={(newAttrs: any) => {
                      setReactShapes(prev => prev.map(shape => 
                        shape.id === item.id ? { ...shape, ...newAttrs } : shape
                      ));
                    }}
                  />
                );
              } else if (item.type === 'stickyNote') {
                return (
                  <EditableStickyNoteComponent
                    key={item.id}
                    ref={shapeRefs.current[item.id]}
                    shapeData={item as ReactShape}
                    isSelected={selectedNodeId === item.id}
                    activeTool={activeTool}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeId(item.id);
                      }
                    }}
                    onUpdate={(newAttrs: any) => {
                      setReactShapes(prev => prev.map(shape => 
                        shape.id === item.id ? { ...shape, ...newAttrs } : shape
                      ));
                    }}
                  />
                );
              } else {
                return null;
              }
            }
          })}

          {/* Lines */}
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