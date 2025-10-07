import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, RegularPolygon } from "react-konva";
import GridLayer from "@/components/gridLayer";
import EditableTextComponent from "@/components/editableTextCompoent";
import { ReactShape, Tool } from "../types/board-types";
import { KonvaShape } from "@/hooks/useShapes";

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
  // Create refs for all shapes
  const shapeRefs = useRef<{ [key: string]: any }>({});

  // Update transformer when selection changes - THIS IS THE KEY FIX
  useEffect(() => {
    if (!trRef.current || !selectedNodeId) {
      if (trRef.current) {
        trRef.current.nodes([]);
      }
      return;
    }

    const selectedShape = shapeRefs.current[selectedNodeId];
    if (selectedShape && selectedShape.current) {
      trRef.current.nodes([selectedShape.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedNodeId, shapes]); // Re-run when selection or shapes change

  // Simple click handler
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
          {/* Render Konva shapes with refs */}
          {/* Render Konva shapes with refs */}
{shapes.map((shape) => {
  // Create ref for this shape if it doesn't exist
  if (!shapeRefs.current[shape.id]) {
    shapeRefs.current[shape.id] = React.createRef();
  }

  const commonProps = {
    // REMOVE key and ref from here - they'll be passed directly
    id: shape.id,
    x: shape.x,
    y: shape.y,
    fill: shape.fill,
    draggable: shape.draggable,
    onDragEnd: (e: any) => {
      updateShape(shape.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onClick: (e: any) => {
      e.cancelBubble = true;
      if (activeTool === "select") {
        setSelectedNodeId(shape.id);
      }
    },
    onTap: (e: any) => {
      e.cancelBubble = true;
      if (activeTool === "select") {
        setSelectedNodeId(shape.id);
      }
    },
    name: 'selectable-shape',
  };

  switch (shape.type) {
    case 'rect':
      return (
        <Rect
          key={shape.id} // ✅ Pass key directly
          ref={shapeRefs.current[shape.id]} // ✅ Pass ref directly
          {...commonProps}
          width={shape.width || 100}
          height={shape.height || 100}
        />
      );
    case 'circle':
      return (
        <Circle
          key={shape.id} // ✅ Pass key directly
          ref={shapeRefs.current[shape.id]} // ✅ Pass ref directly
          {...commonProps}
          radius={shape.radius || 50}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          key={shape.id} // ✅ Pass key directly
          ref={shapeRefs.current[shape.id]} // ✅ Pass ref directly
          {...commonProps}
          radiusX={shape.radiusX || 80}
          radiusY={shape.radiusY || 50}
        />
      );
      case 'triangle':
      return (
        <RegularPolygon
          key={shape.id}
          ref={shapeRefs.current[shape.id]}
          {...commonProps}
          sides={3}
          radius={50}
        />
      );
    case 'arrow':
      return (
        <Arrow
          key={shape.id} // ✅ Pass key directly
          ref={shapeRefs.current[shape.id]} // ✅ Pass ref directly
          {...commonProps}
          points={shape.points || [0, 0, 100, 0]}
          stroke={shape.fill}
          fill={shape.fill}
          strokeWidth={2}
          pointerLength={10}
          pointerWidth={10}
        />
      );
    default:
      return null;
  }
})}

          {/* Rest of your existing code for lines and reactShapes remains the same */}
         {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points} // Raw screen coordinates - no transformation needed
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
          {/* // In your StageComponent, update the EditableTextComponent usage: */}
{reactShapes.map((shapeData) => {
  if (shapeData.type === 'text') {
    return (
      <EditableTextComponent
        key={shapeData.id}
        id={shapeData.id}
        x={shapeData.x}
        y={shapeData.y}
        text={shapeData.text || "Double click to edit"}
        fontSize={shapeData.fontSize || 20}
        fill={shapeData.fill || "black"}
        // PASS ALL THE FORMATTING PROPERTIES
        fontFamily={shapeData.fontFamily || "Arial"}
        fontWeight={shapeData.fontWeight || "normal"}
        fontStyle={shapeData.fontStyle || "normal"}
        textDecoration={shapeData.textDecoration || "none"}
        align={shapeData.align || "left"}
        isSelected={selectedNodeId === shapeData.id}
        activeTool={activeTool}
        onSelect={() => {
          if (activeTool === "select") {
            setSelectedNodeId(shapeData.id);
          }
        }}
        onUpdate={(newAttrs) => {
          setReactShapes(prev => 
            prev.map(shape => 
              shape.id === shapeData.id 
                ? { ...shape, ...newAttrs }
                : shape
            )
          );
        }}
      />
    );
  }
  return null;
})}
          {/* Transformer - this will now work properly */}
          <Transformer
            ref={trRef}
            enabledAnchors={[
              "top-left", "top-right", 
              "bottom-left", "bottom-right",
              "middle-top", "middle-bottom", 
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