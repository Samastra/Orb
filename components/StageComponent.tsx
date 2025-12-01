// components/StageComponent.tsx
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, Image, Path, Group } from "react-konva";
import GridLayer from "@/components/gridLayer"; // Ensure this path is correct
import { ReactShape, Tool, ImageShape } from "../types/board-types";
import TextComponent from "./TextComponent";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection, Side } from "@/hooks/useBoardState";
import { getOrthogonalPoints, getAnchorPoint, Rect as UtilsRect } from "@/lib/connection-utils";
import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

// --- DYNAMIC IMPORT ---
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false });

// --- TYPES ---
type KonvaPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;

interface StageComponentProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  trRef: React.RefObject<Konva.Transformer | null>;
  scale: number;
  position: { x: number; y: number };
  activeTool: Tool | null;
  lines: Array<{ tool: 'brush' | 'eraser', points: number[] }>;
  reactShapes: ReactShape[];
  shapes: KonvaShape[];
  stageFrames: KonvaShape[];
  images: ImageShape[];
  connections: Connection[];
  selectedNodeIds: string[];
  stageInstance: Konva.Stage | null;
  width?: number;
  height?: number;
  hasLoaded?:boolean;
  // Event Handlers
  handleStartTextEditing?: (textProps: any) => void;
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
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onTextCreate: (pos: { x: number; y: number }) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  handleAnchorMouseDown: (e: any, nodeId: string, side: Side, pos: { x: number, y: number }) => void;
  handleAnchorClick: (e: any, nodeId: string, side: Side) => void;
  handleShapeMouseEnter: (id: string) => void;
  tempConnection: Connection | null;
  isSpacePressed?: boolean;
  duplicateShape: (direction: 'top' | 'right' | 'bottom' | 'left') => void;
}

// --- HELPER: NORMALIZE RECT ---
const getNormalizedRect = (shape: any): UtilsRect => {
  if (!shape) return { x: 0, y: 0, width: 0, height: 0 };
  if (shape.type === 'circle') {
    const r = shape.radius || 50;
    return { x: shape.x - r, y: shape.y - r, width: r * 2, height: r * 2 };
  }
  if (shape.type === 'ellipse') {
    const rx = shape.radiusX || 80;
    const ry = shape.radiusY || 50;
    return { x: shape.x - rx, y: shape.y - ry, width: rx * 2, height: ry * 2 };
  }
  return { x: shape.x, y: shape.y, width: shape.width || 100, height: shape.height || 100 };
};

// --- MEMOIZED SUB-COMPONENTS ---

const OrthogonalConnection = React.memo(({ connection, fromShape, toShape, onClick, selected }: any) => {
  if (!fromShape) return null;

  const startRect = getNormalizedRect(fromShape);
  const startPoint = getAnchorPoint(startRect, connection.from.side);

  let endPoint = { x: connection.to.x, y: connection.to.y };
  let endSide: Side = connection.to.side || "left"; 

  if (connection.to.nodeId && toShape) {
    const endRect = getNormalizedRect(toShape);
    const targetSide = connection.to.side || (connection.from.side === 'left' ? 'right' : 'left');
    endPoint = getAnchorPoint(endRect, targetSide);
    endSide = targetSide;
  }

  // PASS 10 as the last argument to retract the line by 10px (Arrowhead size)
  const points = getOrthogonalPoints(startPoint, endPoint, connection.from.side, endSide, 40, 10);
  
  const strokeColor = selected ? "#3366FF" : (connection.stroke || "#64748B");

  return (
    <Group onClick={onClick} onTap={onClick}>
      {/* 1. Fat Invisible Path (Click Target) */}
      <Arrow 
        points={points} 
        stroke="transparent" 
        strokeWidth={30} // Even fatter hit area
        cornerRadius={30} 
      />
      
      {/* 2. Visible Curve with Arrowhead */}
      <Arrow
        points={points}
        stroke={strokeColor}
        strokeWidth={selected ? 4 : (connection.strokeWidth || 4)}
        fill={strokeColor}
        cornerRadius={30}       // <--- 30px Radius for BIG curves
        pointerLength={10}      // <--- Arrowhead Length
        pointerWidth={10}
        lineCap="round"
        lineJoin="round"
        dash={connection.id === 'temp-connection' ? [5, 5] : undefined}
        listening={false}
      />
    </Group>
  );
});
OrthogonalConnection.displayName = "OrthogonalConnection";

const AnchorOverlay = React.memo(({ shape, onMouseDown, onClick }: any) => {
  if (!shape) return null;

  const rect = getNormalizedRect(shape);
  const sides: Side[] = ["top", "right", "bottom", "left"];
  const OFFSET = 15; // <--- PUSH DOTS OUTWARD

  return (
    <Group>
      {sides.map(side => {
        const pos = getAnchorPoint(rect, side);
        
        // Apply Offset
        let displayX = pos.x;
        let displayY = pos.y;
        if (side === 'top') displayY -= OFFSET;
        if (side === 'bottom') displayY += OFFSET;
        if (side === 'left') displayX -= OFFSET;
        if (side === 'right') displayX += OFFSET;

        return (
          <Group 
            key={side} 
            x={displayX} 
            y={displayY}
            onMouseDown={(e) => {
               e.cancelBubble = true;
               onMouseDown(e, side, pos); // Pass original pos logic, but visual is offset
            }}
            onClick={(e) => onClick(e, side)}
            onTap={(e) => onClick(e, side)}
            onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if(stage) stage.container().style.cursor = "crosshair";
            }}
            onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if(stage) stage.container().style.cursor = "default";
            }}
          >
            {/* Massive Hit Area */}
            <Circle radius={30} fill="transparent" />
            
            {/* Visible Dot */}
            <Circle 
               radius={6} 
               fill="#ffffff" 
               stroke="#3366FF" 
               strokeWidth={2} 
               shadowBlur={4} 
               shadowColor="rgba(0,0,0,0.15)"
               listening={false} 
            />
          </Group>
        );
      })}
    </Group>
  );
});
AnchorOverlay.displayName = "AnchorOverlay";


const ImageElement = React.memo(React.forwardRef<Konva.Image, any>(({ imageShape, ...props }, ref) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  
  // Use a ref to prevent re-creating the image object on every render
  useEffect(() => {
    if (!imageShape.src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageShape.src;
    img.onload = () => setImage(img);
  }, [imageShape.src]);

  if (!image) return <Rect x={imageShape.x} y={imageShape.y} width={imageShape.width} height={imageShape.height} fill="#f0f0f0" />;

  return (
    <Image
      ref={ref}
      image={image}
      x={imageShape.x}
      y={imageShape.y}
      width={imageShape.width}
      height={imageShape.height}
      rotation={imageShape.rotation}
      draggable={imageShape.draggable}
      name="selectable-shape"
      id={imageShape.id}
      {...props}
    />
  );
}));
ImageElement.displayName = 'ImageElement';

// --- NEW: GENERIC SHAPE RENDERER ---
// This component decides what to render and is memoized to prevent re-renders of untouched shapes
const ShapeRenderer = React.memo(({ item, isSelected, isEditing, setEditingId, updateShape, commonProps, setShapeRef }: any) => {
  
  // Attach ref
  const handleRef = (node: Konva.Node | null) => {
     setShapeRef(item.id, node);
  };

  if (item.__kind === 'stage') {
    return <Rect ref={handleRef} {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} cornerRadius={item.cornerRadius} />;
  }
  
  if (item.__kind === 'image') {
    return <ImageElement ref={handleRef} imageShape={item} {...commonProps} />;
  }

  if (item.__kind === 'konva') {
    if (item.type === 'triangle') return <Line ref={handleRef} {...commonProps} points={item.points} fill={item.fill} closed={true} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
    if (item.type === 'arrow') return <Arrow ref={handleRef} {...commonProps} points={item.points} fill={item.fill} stroke={item.stroke || item.fill} strokeWidth={item.strokeWidth || 2} pointerLength={item.pointerLength || 10} pointerWidth={item.pointerWidth || 10} />;
    if (item.type === 'circle') return <Circle ref={handleRef} {...commonProps} x={item.x} y={item.y} radius={item.radius || 50} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
    if (item.type === 'ellipse') return <Ellipse ref={handleRef} {...commonProps} x={item.x} y={item.y} radiusX={item.radiusX || 80} radiusY={item.radiusY || 50} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
    return <Rect ref={handleRef} {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} cornerRadius={item.cornerRadius} />;
  }

  if (item.__kind === 'react') {
    if (item.type === 'text') {
      return <TextComponent ref={handleRef} {...commonProps} {...item} isSelected={isSelected} isEditing={isEditing} onStartEditing={() => setEditingId(item.id)} onFinishEditing={() => setEditingId(null)} onUpdate={(attrs) => updateShape(item.id, attrs)} />;
    }
    if (item.type === 'stickyNote') {
      return <EditableStickyNoteComponent ref={handleRef} shapeData={item} isSelected={isSelected} activeTool={null} onSelect={commonProps.onClick} onUpdate={(attrs) => updateShape(item.id, attrs)} {...commonProps} />;
    }
  }

  return null;
}, (prev, next) => {
  // CUSTOM COMPARISON FOR PERFORMANCE
  // Only re-render if the item data changed, or selection/editing state changed for THIS item
  return (
    prev.item === next.item &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    // Optimization: Ignore commonProps functions, assuming they are stable or we don't care if they change 
    // (unless you need to update handlers dynamically)
    prev.commonProps.draggable === next.commonProps.draggable 
  );
});
ShapeRenderer.displayName = "ShapeRenderer";



// --- NEW COMPONENT: Quick Actions Overlay ---
const QuickActionsOverlay = React.memo(({ selectedNodeId, allShapesMap, onDuplicate }: any) => {
  const shape = allShapesMap.get(selectedNodeId);
  if (!shape) return null;

  // 1. Calculate Bounds
  // We reuse the normalization logic to get the visual box
  const rect = getNormalizedRect(shape);
  const { x, y, width, height } = rect;

  // 2. Button Configuration
  const GAP = 20; // Distance from shape edge
  const BUTTON_SIZE = 24;
  const HALF_BTN = BUTTON_SIZE / 2;

  // Positions for 4 buttons (Top, Right, Bottom, Left)
  const actions = [
    { dir: 'top',    x: x + width / 2,         y: y - GAP },
    { dir: 'right',  x: x + width + GAP,       y: y + height / 2 },
    { dir: 'bottom', x: x + width / 2,         y: y + height + GAP },
    { dir: 'left',   x: x - GAP,               y: y + height / 2 },
  ];

  return (
    <Group>
      {actions.map((action) => (
        <Group
          key={action.dir}
          x={action.x}
          y={action.dir === 'top' || action.dir === 'bottom' ? action.y - HALF_BTN : action.y - HALF_BTN} // Center adjustment
        >
          {/* Hit Area (Invisible, larger for easier clicking) */}
          <Circle
            radius={BUTTON_SIZE}
            fill="transparent"
            onClick={(e) => {
               e.cancelBubble = true;
               onDuplicate(action.dir);
            }}
            onMouseEnter={(e) => {
               const container = e.target.getStage()?.container();
               if(container) container.style.cursor = "pointer";
               // Visual Hover Effect: Find the visible circle sibling
               const circle = (e.target.getParent() as Konva.Group)?.findOne('.visible-btn');
               if(circle) circle.to({ opacity: 1, scaleX: 1.2, scaleY: 1.2, duration: 0.1 });
            }}
            onMouseLeave={(e) => {
               const container = e.target.getStage()?.container();
               if(container) container.style.cursor = "default";
               const circle = (e.target.getParent() as Konva.Group)?.findOne('.visible-btn');
               if(circle) circle.to({ opacity: 0.5, scaleX: 1, scaleY: 1, duration: 0.1 });
            }}
          />
          
          {/* Visible Button */}
          <Circle
            name="visible-btn"
            radius={8}
            fill="#3366FF" // Your Brand Blue
            opacity={0.0} // Hidden by default, or 0.5 if you want them always faint
            listening={false} // Let the hit area handle events
          />
          
          {/* Plus Icon (Mocked with Lines) - Only visible on hover? 
              Actually, let's keep it simple: A Blue Dot that grows is very "Figma"
              If you want a '+' sign, we can add Lines, but a dot is cleaner.
          */}
        </Group>
      ))}
    </Group>
  );
});
QuickActionsOverlay.displayName = "QuickActionsOverlay";


// --- MAIN COMPONENT ---

const StageComponent: React.FC<StageComponentProps> = ({
  stageRef, trRef, scale, position, activeTool, lines, hasLoaded,
  reactShapes, shapes, stageFrames, images, connections,
  selectedNodeIds, stageInstance, width, height,duplicateShape,
  handleWheel, handleMouseDown, handleMouseUp, handleMouseMove,
  handleTouchStart, handleTouchEnd, handleTouchMove,
  setSelectedNodeIds, setReactShapes, setShapes, setImages,
  setStageFrames, updateShape, setStageInstance,
  editingId, setEditingId, onTextCreate,
  hoveredNodeId, setHoveredNodeId, handleAnchorMouseDown, handleAnchorClick, tempConnection, isSpacePressed = false
}) => {
  const shapeRefs = useRef<{ [key: string]: Konva.Node | null }>({});
  const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  const setShapeRef = useCallback((id: string, node: Konva.Node | null) => {
    if (node) shapeRefs.current[id] = node;
    else delete shapeRefs.current[id];
  }, []);

  // Removed the global "useEffect batchDraw" - React-Konva handles this better alone.

  // --- MEMOIZE ALL SHAPES MAP ---
  // Create a single lookup map for connections (Optimization)
  const allShapesMap = useMemo(() => {
    const map = new Map();
    [...shapes, ...reactShapes, ...images, ...stageFrames].forEach(s => map.set(s.id, s));
    return map;
  }, [shapes, reactShapes, images, stageFrames]);

  // --- OPTIMIZED DRAGGING (UNCONTROLLED) ---
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node) return;
    
    // If dragging a node that isn't selected, select it (unless holding shift/ctrl)
    if (!selectedNodeIds.includes(node.id())) {
       setSelectedNodeIds([node.id()]);
    }

    // Capture start positions for ALL selected nodes
    const startPositions = new Map<string, {x:number, y:number}>();
    
    // We need to look up the current nodes from refs to get "real" positions
    selectedNodeIds.forEach(id => {
       const ref = shapeRefs.current[id];
       if (ref) startPositions.set(id, { x: ref.x(), y: ref.y() });
    });
    
    // Ensure the dragged node is also captured (might be redundant but safe)
    startPositions.set(node.id(), { x: node.x(), y: node.y() });
    
    dragStartPos.current = startPositions;
  }, [selectedNodeIds, setSelectedNodeIds]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // 🚀 PERFORMANCE CRITICAL: Direct DOM Manipulation
    // We do NOT call setShapes/setReactShapes here. We just move the nodes.
    const node = e.target;
    const startPos = dragStartPos.current.get(node.id());
    
    if (!startPos) return;

    const dx = node.x() - startPos.x;
    const dy = node.y() - startPos.y;

    // Move all OTHER selected nodes by the same delta
    selectedNodeIds.forEach(id => {
      if (id === node.id()) return;
      const otherNode = shapeRefs.current[id];
      const otherStart = dragStartPos.current.get(id);
      
      if (otherNode && otherStart) {
        otherNode.x(otherStart.x + dx);
        otherNode.y(otherStart.y + dy);
      }
    });

   if (trRef.current) trRef.current.getLayer()?.batchDraw();// Only redraw the layer, not React render
  }, [selectedNodeIds]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // SYNC BACK TO REACT STATE
    const node = e.target;
    const startPos = dragStartPos.current.get(node.id());
    if(!startPos) return;

    const dx = node.x() - startPos.x;
    const dy = node.y() - startPos.y;

    // Helper to update specific list
    const applyMove = (list: any[], setter: any) => {
        const affected = list.filter(item => selectedNodeIds.includes(item.id));
        if (affected.length === 0) return;

        setter((prev: any[]) => prev.map(item => {
            if (selectedNodeIds.includes(item.id)) {
                // Careful: use the stored start pos to ensure precision
                const myStart = dragStartPos.current.get(item.id);
                if (myStart) {
                    return { ...item, x: myStart.x + dx, y: myStart.y + dy };
                }
            }
            return item;
        }));
    };

    applyMove(reactShapes, setReactShapes);
    applyMove(shapes, setShapes);
    applyMove(images, setImages);
    applyMove(stageFrames, setStageFrames);
    
    dragStartPos.current.clear();
  }, [selectedNodeIds, reactShapes, shapes, images, stageFrames, setReactShapes, setShapes, setImages, setStageFrames]);

  // --- TRANSFORM HANDLER ---
  const handleShapeTransformEnd = useCallback((item: any, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale to 1 and bake into width/height/radius
    node.scaleX(1); node.scaleY(1);
    
    const updates: any = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
    };

    if (item.type === 'circle') {
      updates.radius = Math.max(5, (node as Konva.Circle).radius() * scaleX);
    } else if (item.type === 'ellipse') {
      updates.radiusX = Math.max(5, (node as Konva.Ellipse).radiusX() * scaleX);
      updates.radiusY = Math.max(5, (node as Konva.Ellipse).radiusY() * scaleY);
    } else {
      updates.width = Math.max(5, node.width() * scaleX);
      updates.height = Math.max(5, node.height() * scaleY);
    }
    
    updateShape(item.id, updates);
  }, [updateShape]);

  // --- TRANSFORMER ATTACHMENT ---
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedNodeIds.length === 0) {
      trRef.current.nodes([]);
      return;
    }
    
    const nodes = selectedNodeIds
      .map(id => shapeRefs.current[id])
      .filter((n): n is Konva.Node => !!n);
      
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds, shapes, reactShapes, images, stageFrames]); 

  // --- PREPARE RENDER LISTS ---
  // We strictly separate the lists to avoid recreating objects unnecessarily
  const combinedShapes = useMemo(() => [
    ...stageFrames.map(s => ({ ...s, __kind: 'stage' })),
    ...shapes.map(s => ({ ...s, __kind: 'konva' })),
    ...images.map(s => ({ ...s, __kind: 'image' })),
    ...reactShapes.map(s => ({ ...s, __kind: 'react' })),
  ], [stageFrames, shapes, images, reactShapes]);

  const handleStageClick = (e: KonvaPointerEvent) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
        if (editingId) setEditingId(null);
        setSelectedNodeIds([]);
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
        {/* GRID LAYER - Static, doesn't need to re-render with shapes */}
        <GridLayer stage={stageInstance} />
        
        <Layer name="draw-layer">
          {combinedShapes.map((item: any) => (
             <ShapeRenderer 
                key={item.id}
                item={item}
                isSelected={selectedNodeIds.includes(item.id)}
                isEditing={editingId === item.id}
                setEditingId={setEditingId}
                updateShape={updateShape}
                setShapeRef={setShapeRef}
                commonProps={{
                    id: item.id,
                    draggable: (activeTool === 'select' || activeTool === null) && !isSpacePressed,
                    name: 'selectable-shape',
                    onClick: (e: any) => { 
                        e.cancelBubble=true; 
                        setSelectedNodeIds([item.id]); 
                        setEditingId(null);
                    },
                    onTap: (e: any) => { 
                        e.cancelBubble=true; 
                        setSelectedNodeIds([item.id]); 
                        setEditingId(null);
                    },
                    onDragStart: handleDragStart,
                    onDragMove: handleDragMove, // The new optimized handler
                    onDragEnd: handleDragEnd,   // The new optimized handler
                    onTransformEnd: (e: any) => handleShapeTransformEnd(item, e),
                    onMouseEnter: (item.type === 'text' || item.type === 'stickyNote') 
                        ? undefined 
                        : () => setHoveredNodeId(item.id),
                    onMouseLeave: () => setHoveredNodeId(null),
                }}
             />
          ))}

          {/* CONNECTIONS */}
          {connections.map(conn => (
            <OrthogonalConnection 
                key={conn.id} 
                connection={conn}
                fromShape={allShapesMap.get(conn.from.nodeId)}
                toShape={conn.to.nodeId ? allShapesMap.get(conn.to.nodeId) : null}
                onClick={(e: any) => { e.cancelBubble=true; setSelectedNodeIds([conn.id]); }}
                selected={selectedNodeIds.includes(conn.id)}
            />
          ))}

          {/* TEMP CONNECTION */}
          {tempConnection && (
            <OrthogonalConnection 
                connection={tempConnection} 
                fromShape={allShapesMap.get(tempConnection.from.nodeId)}
                toShape={tempConnection.to.nodeId ? allShapesMap.get(tempConnection.to.nodeId) : null}
            />
          )}

          {/* ANCHORS (Only show when hovering and tool is connect) */}
          {hoveredNodeId && activeTool === "connect" && allShapesMap.has(hoveredNodeId) && (
            <AnchorOverlay 
                shape={allShapesMap.get(hoveredNodeId)}
                onMouseDown={(e: any, side: Side, pos: any) => handleAnchorMouseDown(e, hoveredNodeId, side, pos)}
                onClick={(e: any, side: Side) => handleAnchorClick(e, hoveredNodeId, side)}
            />
          )}
          
          {/* BRUSH LINES */}
          {lines.map((line, i) => (
            <Line 
                key={i} 
                points={line.points} 
                stroke={line.tool === 'brush' ? '#000' : '#fff'} 
                strokeWidth={5} 
                tension={0.5} 
                lineCap="round" 
                lineJoin="round" 
                globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'} 
                listening={false} // Optimization: Lines don't need hit detection usually
            />
          ))}

          {/* 1. Calculate if we should hide anchors */}
          {(() => {
            const selectedNode = selectedNodeIds.length === 1 ? allShapesMap.get(selectedNodeIds[0]) : null;
            // Hide anchors for Sticky Notes and Stage Frames
            const shouldHideAnchors = selectedNode && (selectedNode.type === 'stickyNote' || selectedNode.type === 'stage');

            return (
              <Transformer 
                ref={trRef}
                
                // --- LOGIC: HIDE ANCHORS ---
                resizeEnabled={!shouldHideAnchors}
                rotateEnabled={!shouldHideAnchors} // Remove this line if you still want them to rotate!
                
                // --- VISUALS: FIGMA STYLE UI ---
                borderStroke="#3366FF"        // Brand Blue
                borderStrokeWidth={1.5}       // Crisp thin line
                anchorSize={11}               // Smaller, cleaner handles
                anchorCornerRadius={6}        // Circular/Rounded handles (Very modern)
                anchorStroke="#3366FF"        // Blue border on handles
                anchorFill="#FFFFFF"          // White center
                anchorStrokeWidth={1.5}
                rotationSnaps={[0, 90, 180, 270]} // Snap to clean angles
                padding={8}                   // Little breathing room between shape and border
                ignoreStroke={true}           // keeps calculations accurate
              />
            );
          })()}


          {/* NEW: Quick Actions (Only show if exactly 1 item selected) */}
          {selectedNodeIds.length === 1 && !isSpacePressed && (
             <QuickActionsOverlay 
                selectedNodeId={selectedNodeIds[0]} 
                allShapesMap={allShapesMap} 
                onDuplicate={duplicateShape} // Pass the prop here
             />
          )}

        </Layer>
      </Stage>
    </div>
  );
};

export default StageComponent;