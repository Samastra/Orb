// components/StageComponent.tsx
import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, RegularPolygon, Image, Path } from "react-konva";
import GridLayer from "@/components/gridLayer";
import EditableTextComponent from "@/components/editableTextCompoent";
import { ReactShape, Tool, ImageShape } from "../types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";
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
  stageFrames: KonvaShape[]; 
  images: ImageShape[];
  connections: Connection[];
  selectedNodeId: string | null;
  stageInstance: Konva.Stage | null;
  width?: number;
  height?: number;
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
  setImages: React.Dispatch<React.SetStateAction<ImageShape[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  // ADD THIS LINE:
  setStageFrames: React.Dispatch<React.SetStateAction<KonvaShape[]>>;
  updateShape: (id: string, attrs: Partial<KonvaShape>) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
}

// Simple combined shape type - UPDATED TO INCLUDE CONNECTIONS
type CombinedShape = 
  | (KonvaShape & { __kind: 'konva' })
  | (ReactShape & { __kind: 'react' })
  | (KonvaShape & { __kind: 'stage' })
  | (ImageShape & { __kind: 'image' })
  | (Connection & { __kind: 'connection' }); // NEW: Connection type

// Image Component - Using native Konva Image (NO react-konva-image)
const ImageElement = React.forwardRef(({ 
  imageShape, 
  onDragEnd 
}: { 
  imageShape: ImageShape;
  onDragEnd: (e: any) => void;
}, ref: any) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = React.useState<{width: number, height: number} | null>(null);
  const internalRef = React.useRef<Konva.Image>(null);

  // Combine internal ref with forwarded ref
  React.useImperativeHandle(ref, () => internalRef.current);

  // Load image using native JavaScript and get natural dimensions
  React.useEffect(() => {
    const img = new (window as any).Image();
    img.src = imageShape.src;
    img.onload = () => {
      setImage(img);
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageShape.src);
    };
  }, [imageShape.src]);

  if (!image || !imageDimensions) {
    return (
      <Rect
        ref={internalRef}
        x={imageShape.x}
        y={imageShape.y}
        width={200}
        height={150}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        draggable={imageShape.draggable}
        onDragEnd={onDragEnd}
        name="selectable-shape"
      />
    );
  }

  return (
    <Image
      ref={internalRef}
      image={image}
      x={imageShape.x}
      y={imageShape.y}
      width={imageDimensions.width}
      height={imageDimensions.height}
      rotation={imageShape.rotation}
      draggable={imageShape.draggable}
      onDragEnd={onDragEnd}
      name="selectable-shape"
      // Add explicit ID for selection
      id={imageShape.id}
    />
  );
});

ImageElement.displayName = 'ImageElement';

// NEW: Connection Component
const ConnectionElement = React.forwardRef(({ 
  connection, 
  onDragEnd,
  onClick 
}: { 
  connection: Connection;
  onDragEnd: (e: any) => void;
  onClick: (e: any) => void;
}, ref: any) => {
  const internalRef = React.useRef<Konva.Path>(null);

  // Combine internal ref with forwarded ref
  React.useImperativeHandle(ref, () => internalRef.current);

  // Build path data from connection points
  const buildConnectionPath = (conn: Connection) => {
    const from = conn.from;
    const to = conn.to;
    
    // Use stored control points or calculate straight line
    if (conn.cp1x !== undefined && conn.cp1y !== undefined && 
        conn.cp2x !== undefined && conn.cp2y !== undefined) {
      return `M ${from.x} ${from.y} C ${conn.cp1x} ${conn.cp1y}, ${conn.cp2x} ${conn.cp2y}, ${to.x} ${to.y}`;
    } else {
      // Fallback to straight line
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
  };

  return (
    <Path
      ref={internalRef}
      data={buildConnectionPath(connection)}
      stroke={connection.stroke || '#333'}
      strokeWidth={connection.strokeWidth || 2}
      lineCap="round"
      lineJoin="round"
      listening={true} // Allow clicking on the connection
      onClick={onClick}
      onTap={onClick}
      name="selectable-shape connection-path"
      id={connection.id}
    />
  );
});

ConnectionElement.displayName = 'ConnectionElement';

const StageComponent: React.FC<StageComponentProps> = ({
  stageRef,
  trRef,
  scale,
  position,
  activeTool,
  lines,
  reactShapes,
  shapes,
  stageFrames,
  images,
  connections,
  selectedNodeId,
  stageInstance,
  width,
  height,
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
  setImages,
  setConnections,
  // ADD THIS LINE:
  setStageFrames,
  updateShape,
  setStageInstance,
}) => {
  const shapeRefs = useRef<{ [key: string]: any }>({});

  // Sync shape refs while preserving existing refs to avoid remounts - UPDATED WITH CONNECTIONS
  useEffect(() => {
    const allIds = [
      ...stageFrames.map(s => s.id),
      ...shapes.map(s => s.id),
      ...reactShapes.map(r => r.id),
      ...images.map(i => i.id),
      ...connections.map(c => c.id) // NEW: Include connections
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
  }, [stageFrames, shapes, reactShapes, images, connections]); // NEW: Add connections dependency

  // UPDATED: Combine shapes and render in array order - INCLUDES CONNECTIONS
  const allShapesToRender = React.useMemo(() => {
    console.log('🔄 StageComponent re-rendering with shapes:', {
      stageFrames: stageFrames.length,
      konvaShapes: shapes.length,
      reactShapes: reactShapes.length,
      images: images.length,
      connections: connections.length, // NEW: Log connections
      total: stageFrames.length + shapes.length + reactShapes.length + images.length + connections.length
    });
    
    // Fixed rendering order: stageFrames → konvaShapes → images → connections → reactShapes
    return [
      ...stageFrames.map(s => ({ ...s, __kind: 'stage' as const })),
      ...shapes.map(s => ({ ...s, __kind: 'konva' as const })),
      ...images.map(s => ({ ...s, __kind: 'image' as const })),
      ...connections.map(s => ({ ...s, __kind: 'connection' as const })), // NEW: Add connections
      ...reactShapes.map(s => ({ ...s, __kind: 'react' as const })),
    ];
  }, [stageFrames, shapes, reactShapes, images, connections]); // NEW: Add connections dependency

  // Transformer management - UPDATED FOR CONNECTIONS
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
    
    // FIXED: Only exclude sticky notes and connections from transformer
    if (selectedShape && (
      (selectedShape.__kind === 'react' && selectedShape.type === 'stickyNote') ||
      selectedShape.__kind === 'connection' // Connections don't use transformer
    )) {
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

    console.log('🖱️ Stage click - target:', {
      name: e.target.name(),
      id: e.target.id(),
      className: e.target.className,
      attrs: e.target.attrs
    });

    if (e.target === stage) {
      setSelectedNodeId(null);
      return;
    }
    
    if (e.target.hasName('selectable-shape')) {
      console.log('✅ Selecting shape:', e.target.id());
      setSelectedNodeId(e.target.id());
    } else {
      console.log('❌ Not a selectable shape:', e.target.name());
    }
  };

const handleShapeDragEnd = (item: CombinedShape, e: any) => {
  try {
    // Only handle drag for shapes that have x,y coordinates (not connections)
    if (item.__kind === 'connection') {
      return; // Connections are not draggable themselves
    }

    const nx = e.target.x();
    const ny = e.target.y();

    if (item.__kind === 'konva') {
      updateShape(item.id, { x: nx, y: ny });
    } else if (item.__kind === 'react') {
      setReactShapes(prev => prev.map(s =>
        s.id === item.id ? { ...s, x: nx, y: ny } : s
      ));
    } else if (item.__kind === 'image') {
      // Handle image drag
      setImages(prev => prev.map(img =>
        img.id === item.id ? { ...img, x: nx, y: ny } : img
      ));
    } else if (item.__kind === 'stage') {
      // FIXED: Add proper TypeScript types
      setStageFrames((prev: KonvaShape[]) => prev.map((f: KonvaShape) =>
        f.id === item.id ? { ...f, x: nx, y: ny } : f
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

  // NEW: Handle connection click
  const handleConnectionClick = (connection: Connection, e: any) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      console.log('🔗 Connection clicked:', connection.id);
      setSelectedNodeId(connection.id);
    }
  };

  // Handle image drag end
  const handleImageDragEnd = (imageShape: ImageShape, e: any) => {
    const node = e.target;
    
    // Check if this was a resize (transform) or just a move
    const wasResized = node.width() !== imageShape.width || node.height() !== imageShape.height;
    
    if (wasResized) {
      // Image was resized - update both position and size
      setImages(prev => prev.map(img => 
        img.id === imageShape.id 
          ? { 
              ...img, 
              x: node.x(), 
              y: node.y(),
              width: node.width(),
              height: node.height()
            }
          : img
      ));
    } else {
      // Image was just moved - update position only
      setImages(prev => prev.map(img => 
        img.id === imageShape.id 
          ? { ...img, x: node.x(), y: node.y() }
          : img
      ));
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <Stage
        width={width || (typeof window !== "undefined" ? window.innerWidth : 800)}
        height={height || (typeof window !== "undefined" ? window.innerHeight : 600)}
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
          {/* SIMPLE RENDERING: Render all shapes in array order */}
          {allShapesToRender.map((item) => {
            console.log(`🎯 Rendering shape: ${item.id} (${item.__kind}:${item.type})`);

            const commonProps = {
                  id: item.id,
                  // Only add x and y for shapes that have them (not connections)
                  ...(item.__kind !== 'connection' && {
                    x: item.x,
                    y: item.y,
                  }),
                  draggable: (item.draggable ?? true) && activeTool === "select",
                  name: 'selectable-shape',
                  onDragEnd: (e: any) => handleShapeDragEnd(item, e),
                  onClick: (e: any) => handleShapeClick(item, e),
                  onTap: (e: any) => handleShapeClick(item, e),
                };

            if (item.__kind === 'stage') {
              const stageItem = item as KonvaShape;
              return (
                <Rect
                  key={item.id}
                  ref={shapeRefs.current[item.id]}
                  {...commonProps}
                  width={stageItem.width ?? 800}
                  height={stageItem.height ?? 600}
                  fill={stageItem.fill || "#ffffff"}
                  stroke={stageItem.stroke || "#cccccc"}
                  strokeWidth={stageItem.strokeWidth || 2}
                  cornerRadius={0}
                  name="stage-frame"
                />
              );
            } else if (item.__kind === 'image') {
                const imageItem = item as ImageShape;
                return (
                  <ImageElement
                    key={item.id}
                    ref={shapeRefs.current[item.id]}
                    imageShape={imageItem}
                    onDragEnd={(e) => handleImageDragEnd(imageItem, e)}
                  />
                );
              } else if (item.__kind === 'connection') {
              // NEW: Render connection
              const connectionItem = item as Connection;
              return (
                <ConnectionElement
                  key={item.id}
                  ref={shapeRefs.current[item.id]}
                  connection={connectionItem}
                  onDragEnd={(e) => handleShapeDragEnd(item, e)}
                  onClick={(e) => handleConnectionClick(connectionItem, e)}
                />
              );
            } else if (item.__kind === 'konva') {
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
              "middle-left", "middle-right",   // ← ADD THESE
              "middle-top", "middle-bottom"
              // Remove center anchors to prevent skewing
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              const selectedShape = allShapesToRender.find(item => item.id === selectedNodeId);
              
              // If it's an image, maintain aspect ratio
              if (selectedShape && selectedShape.__kind === 'image') {
                const imageShape = selectedShape as ImageShape;
                const aspectRatio = imageShape.width / imageShape.height;
                
                let width = newBox.width;
                let height = newBox.height;
                
                // Maintain aspect ratio
                if (Math.abs(width - oldBox.width) > Math.abs(height - oldBox.height)) {
                  // Width changed more, adjust height to match aspect ratio
                  height = width / aspectRatio;
                } else {
                  // Height changed more, adjust width to match aspect ratio
                  width = height * aspectRatio;
                }
                
                return {
                  ...newBox,
                  width: Math.max(20, width), // Minimum size
                  height: Math.max(20, height),
                };
              }
              
              // For other shapes, use normal behavior
              return {
                ...newBox,
                width: Math.max(20, newBox.width),
                height: Math.max(20, newBox.height),
              };
            }}
            keepRatio={false} // We handle ratio manually for images
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