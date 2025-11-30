// components/StageComponent.tsx
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, RegularPolygon, Image, Path, Group } from "react-konva";
import GridLayer from "@/components/gridLayer";
import { ReactShape, Tool, ImageShape } from "../types/board-types";
import TextComponent from "./TextComponent";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection, Side } from "@/hooks/useBoardState";
import { getOrthogonalPath, getAnchorPoint, Rect as UtilsRect } from "@/lib/connection-utils";
import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

// Dynamic import for Stage
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), {
  ssr: false,
});

// Helper type to fix MouseEvent vs TouchEvent conflicts
type KonvaPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;

const isMouseEvent = (evt: Event): evt is MouseEvent => {
  return 'shiftKey' in evt;
};

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
  selectedNodeIds: string[];
  stageInstance: Konva.Stage | null;
  width?: number;
  height?: number;
  hasLoaded?: boolean;
  // Tool Handlers passed from useKonvaTools
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  
  // State Setters
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  setReactShapes: React.Dispatch<React.SetStateAction<ReactShape[]>>;
  setShapes: React.Dispatch<React.SetStateAction<KonvaShape[]>>;
  setImages: React.Dispatch<React.SetStateAction<ImageShape[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  setStageFrames: React.Dispatch<React.SetStateAction<KonvaShape[]>>;
  updateShape: (id: string, attrs: Partial<KonvaShape>) => void;
  setStageInstance: (stage: Konva.Stage | null) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  onDelete: (id: string) => void;
  setActiveTool: (tool: Tool | null) => void;
  
  // Text Editing
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onTextCreate: (pos: { x: number; y: number }) => void;
  handleStartTextEditing?: (textProps: any) => void;

  // NEW PROPS FOR ANCHORS
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  handleAnchorMouseDown: (e: any, nodeId: string, side: Side, pos: {x: number, y: number}) => void;
  handleAnchorClick: (e: any, nodeId: string, side: Side) => void;
  handleShapeMouseEnter: (id: string) => void;
  tempConnection: Connection | null; // The phantom line
}

// --- SUB-COMPONENTS ---

// 1. Orthogonal Connection Component
const OrthogonalConnection = React.memo(({ 
  connection, 
  fromShape, 
  toShape, 
  onClick, 
  selected 
}: { 
  connection: Connection, 
  fromShape?: any, 
  toShape?: any, 
  onClick?: (e: any) => void,
  selected?: boolean 
}) => {
  
  if (!fromShape) return null;

  // Calculate Start Point
  const startRect: UtilsRect = {
    x: fromShape.x,
    y: fromShape.y,
    width: fromShape.width || 100,
    height: fromShape.height || 100
  };
  const startPoint = getAnchorPoint(startRect, connection.from.side);

  // Calculate End Point
  let endPoint = { x: connection.to.x, y: connection.to.y };
  let endSide: Side = connection.to.side || "left"; // Default fallback

  // If connected to a node, calculate exact anchor position
  if (connection.to.nodeId && toShape) {
    const endRect: UtilsRect = {
        x: toShape.x,
        y: toShape.y,
        width: toShape.width || 100,
        height: toShape.height || 100
    };
    // If side is missing, default to opposite of start (simple heuristic)
    const targetSide = connection.to.side || (connection.from.side === 'left' ? 'right' : 'left');
    endPoint = getAnchorPoint(endRect, targetSide);
    endSide = targetSide;
  }

  // Generate Path
  const pathData = getOrthogonalPath(
    startPoint, 
    endPoint, 
    connection.from.side, 
    endSide
  );

  return (
    <Group onClick={onClick} onTap={onClick}>
      {/* Invisible thicker path for easier clicking */}
      <Path 
        data={pathData} 
        stroke="transparent" 
        strokeWidth={20} 
      />
      {/* Visible Path */}
      <Path
        data={pathData}
        stroke={selected ? "#007AFF" : (connection.stroke || "#000000")}
        strokeWidth={selected ? 4 : (connection.strokeWidth || 4)}
        lineCap="round"
        lineJoin="round"
        dash={connection.id === 'temp-connection' ? [5, 5] : undefined}
      />
    </Group>
  );
});
OrthogonalConnection.displayName = "OrthogonalConnection";

// 2. Anchor Overlay Component (The Blue Dots)
const AnchorOverlay = React.memo(({ 
  shape, 
  onMouseDown,
  onClick 
}: { 
  shape: any, 
  onMouseDown: (e: any, side: Side, pos: {x: number, y: number}) => void,
  onClick: (e: any, side: Side) => void 
}) => {
  if (!shape) return null;

  const rect: UtilsRect = {
    x: shape.x,
    y: shape.y,
    width: shape.width || 100,
    height: shape.height || 100
  };

  const sides: Side[] = ["top", "right", "bottom", "left"];

  return (
    <Group>
      {sides.map(side => {
        const pos = getAnchorPoint(rect, side);
        return (
          <Group 
            key={side} 
            x={pos.x} 
            y={pos.y}
            onMouseDown={(e) => onMouseDown(e, side, pos)}
            onClick={(e) => onClick(e, side)}
            onTap={(e) => onClick(e, side)}
          >
             {/* Invisible hit area */}
             <Circle radius={15} fill="transparent" />
             {/* Visible Dot */}
             <Circle 
                radius={5} 
                fill="#ffffff" 
                stroke="#007AFF" 
                strokeWidth={2}
                shadowBlur={2}
                shadowColor="rgba(0,0,0,0.3)"
             />
             {/* Hover effect (Plus sign) could go here */}
          </Group>
        );
      })}
    </Group>
  );
});
AnchorOverlay.displayName = "AnchorOverlay";

// 3. Image Component (Preserved)
const ImageElement = React.forwardRef<Konva.Image, {
  imageShape: ImageShape;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}>(({ imageShape, onDragStart, onDragMove, onDragEnd, onTransformEnd }, ref) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const internalRef = React.useRef<Konva.Image>(null);
  React.useImperativeHandle(ref, () => internalRef.current!);
  
  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageShape.src;
    img.onload = () => setImage(img);
  }, [imageShape.src]);
  
  if (!image) return <Rect x={imageShape.x} y={imageShape.y} width={imageShape.width} height={imageShape.height} fill="#f0f0f0" />;
  
  return (
    <Image
      ref={internalRef}
      image={image}
      x={imageShape.x}
      y={imageShape.y}
      width={imageShape.width}
      height={imageShape.height}
      rotation={imageShape.rotation}
      draggable={imageShape.draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      name="selectable-shape"
      id={imageShape.id}
    />
  );
});
ImageElement.displayName = 'ImageElement';


const StageComponent: React.FC<StageComponentProps> = ({
  stageRef, trRef, scale, position, activeTool, lines,
  reactShapes, shapes, stageFrames, images, connections,
  selectedNodeIds, stageInstance, width, height, hasLoaded,
  handleWheel, handleMouseDown, handleMouseUp, handleMouseMove,
  handleTouchStart, handleTouchEnd, handleTouchMove,
  setSelectedNodeIds, setReactShapes, setShapes, setImages,
  setConnections, setStageFrames, updateShape, setStageInstance,
  updateConnection, onDelete, setActiveTool, handleStartTextEditing,
  editingId, setEditingId, onTextCreate,
  // New Props
  hoveredNodeId, setHoveredNodeId, handleAnchorMouseDown, handleAnchorClick, handleShapeMouseEnter, tempConnection
}) => {
  const shapeRefs = useRef<{ [key: string]: Konva.Node | null }>({});
  const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  const setShapeRef = (id: string, node: Konva.Node | null) => {
    if (node) shapeRefs.current[id] = node;
    else delete shapeRefs.current[id];
  };

  // Sync Konva nodes
  useEffect(() => {
    if (!stageRef.current) return;
    requestAnimationFrame(() => {
        stageRef.current?.batchDraw();
    });
  }, [shapes, reactShapes, images, stageFrames, stageRef]);

  // Combined list of shapes for looking up connection targets
  const allShapesMap = useMemo(() => {
    const map = new Map();
    [...shapes, ...reactShapes, ...images, ...stageFrames].forEach(s => map.set(s.id, s));
    return map;
  }, [shapes, reactShapes, images, stageFrames]);

  // ========== DRAG HANDLERS (Preserved) ==========
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node || selectedNodeIds.length <= 1) return;
    selectedNodeIds.forEach(id => {
      const ref = shapeRefs.current[id];
      if (ref && ref !== node) dragStartPos.current.set(id, { x: ref.x(), y: ref.y() });
    });
    dragStartPos.current.set(node.id(), { x: node.x(), y: node.y() });
  }, [selectedNodeIds]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (selectedNodeIds.length <= 1) return;
    const node = e.target;
    const dx = node.x() - (dragStartPos.current.get(node.id())?.x || node.x());
    const dy = node.y() - (dragStartPos.current.get(node.id())?.y || node.y());
    selectedNodeIds.forEach(id => {
      if (id === node.id()) return;
      const other = shapeRefs.current[id];
      const start = dragStartPos.current.get(id);
      if (other && start) {
        other.x(start.x + dx);
        other.y(start.y + dy);
      }
    });
    if (trRef.current) trRef.current.forceUpdate();
  }, [selectedNodeIds]);

  const handleSingleDragEnd = useCallback((item: any, e: any) => {
      // Update state based on item type
      const { x, y } = e.target.attrs;
      if (item.__kind === 'react') setReactShapes(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
      else if (item.__kind === 'konva') setShapes(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
      else if (item.__kind === 'image') setImages(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
      else if (item.__kind === 'stage') setStageFrames(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
  }, [setReactShapes, setShapes, setImages, setStageFrames]);

  // TRANSFORM HANDLER
  const handleShapeTransformEnd = (item: any, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    
    const updates = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        // Add specific handling for Circle radius, Arrow points etc if needed
    };
    updateShape(item.id, updates);
  };

  // Sync Transformer
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedNodeIds.length === 0) {
      trRef.current.nodes([]);
      return;
    }
    const nodes = selectedNodeIds
      .filter(id => !stageFrames.some(frame => frame.id === id))
      .map(id => shapeRefs.current[id])
      .filter((n): n is Konva.Node => !!n);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds, stageFrames]);

  const allShapesToRender = React.useMemo(() => [
    ...stageFrames.map(s => ({ ...s, __kind: 'stage' })),
    ...shapes.map(s => ({ ...s, __kind: 'konva' })),
    ...images.map(s => ({ ...s, __kind: 'image' })),
    ...reactShapes.map(s => ({ ...s, __kind: 'react' })),
  ], [stageFrames, shapes, images, reactShapes]);

  // CLICK HANDLER
  const handleStageClick = (e: KonvaPointerEvent) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
        setSelectedNodeIds([]);
        setEditingId(null);
        if (activeTool === 'text') {
            const pos = e.target.getStage()?.getRelativePointerPosition();
            if(pos) onTextCreate(pos);
        }
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <Stage
        width={width || (typeof window !== "undefined" ? window.innerWidth : 3072)}
        height={height || (typeof window !== "undefined" ? window.innerHeight : 2048)}
        scaleX={scale} scaleY={scale} x={position.x} y={position.y}
        onWheel={handleWheel}
        onClick={handleStageClick} onTap={handleStageClick}
        ref={(node) => { if (node) { stageRef.current = node; setStageInstance(node); } }}
        className="bg-white cursor-move"
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}
      >
        <GridLayer stage={stageInstance} />
        
        <Layer name="draw-layer">
          {/* 1. RENDER SHAPES */}
          {allShapesToRender.map((item: any) => {
            const commonProps = {
                id: item.id,
                draggable: activeTool === 'select',
                name: 'selectable-shape',
                onClick: (e: any) => { e.cancelBubble=true; setSelectedNodeIds([item.id]); },
                onTap: (e: any) => { e.cancelBubble=true; setSelectedNodeIds([item.id]); },
                onDragStart: handleDragStart,
                onDragMove: handleDragMove,
                onDragEnd: (e: any) => handleSingleDragEnd(item, e),
                onTransformEnd: (e: any) => handleShapeTransformEnd(item, e),
                onMouseEnter: () => handleShapeMouseEnter(item.id),
                // onMouseLeave: handled globally or ignored
            };

            if (item.__kind === 'stage') {
                return <Rect key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} fill="#fff" stroke="#ccc" />;
            }
            if (item.__kind === 'image') {
                return <ImageElement key={item.id} ref={node => setShapeRef(item.id, node)} imageShape={item} {...commonProps} />;
            }
            if (item.__kind === 'konva') {
               if (item.type === 'rect') return <Rect key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} {...item} />;
               if (item.type === 'circle') return <Circle key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} {...item} />;
               // Add other Konva shapes here (Ellipse, etc)
               return <Rect key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} {...item} />;
            }
            if (item.__kind === 'react') {
                if (item.type === 'text') {
                    return <TextComponent key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} {...item} isSelected={selectedNodeIds.includes(item.id)} isEditing={editingId === item.id} onStartEditing={() => setEditingId(item.id)} onUpdate={(attrs) => updateShape(item.id, attrs)} />;
                }
                if (item.type === 'stickyNote') {
                    return <EditableStickyNoteComponent key={item.id} ref={node => setShapeRef(item.id, node)} shapeData={item} isSelected={selectedNodeIds.includes(item.id)} activeTool={activeTool} onSelect={() => setSelectedNodeIds([item.id])} onUpdate={(attrs) => updateShape(item.id, attrs)} {...commonProps} />;
                }
            }
            return null;
          })}

          {/* 2. RENDER CONNECTIONS */}
          {connections.map(conn => (
            <OrthogonalConnection 
                key={conn.id} 
                connection={conn}
                fromShape={allShapesMap.get(conn.from.nodeId)}
                toShape={conn.to.nodeId ? allShapesMap.get(conn.to.nodeId) : null}
                onClick={(e) => { e.cancelBubble=true; setSelectedNodeIds([conn.id]); }}
                selected={selectedNodeIds.includes(conn.id)}
            />
          ))}

          {/* 3. PHANTOM CONNECTION (While Dragging) */}
          {tempConnection && (
            <OrthogonalConnection 
                connection={tempConnection} 
                fromShape={allShapesMap.get(tempConnection.from.nodeId)}
                toShape={tempConnection.to.nodeId ? allShapesMap.get(tempConnection.to.nodeId) : null}
            />
          )}

          {/* 4. ANCHOR OVERLAY (On Hover) */}
        {hoveredNodeId && 
           (activeTool === "select" || activeTool === null) && 
           allShapesMap.has(hoveredNodeId) && (
             <AnchorOverlay 
                shape={allShapesMap.get(hoveredNodeId)}
                onMouseDown={(e, side, pos) => handleAnchorMouseDown(e, hoveredNodeId, side, pos)}
                onClick={(e, side) => handleAnchorClick(e, hoveredNodeId, side)}
             />
          )}
          
          {/* 5. DRAWING LINES */}
          {lines.map((line, i) => (
             <Line key={i} points={line.points} stroke={line.tool === 'brush' ? '#000' : '#fff'} strokeWidth={5} tension={0.5} lineCap="round" lineJoin="round" globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'} />
          ))}

          <Transformer ref={trRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default StageComponent;