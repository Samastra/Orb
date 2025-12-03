// components/StageComponent.tsx
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, Image, Path, Group } from "react-konva";
import GridLayer from "@/components/gridLayer"; 
import { ReactShape, Tool, ImageShape } from "../types/board-types";
import TextComponent from "./TextComponent";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection, Side } from "@/hooks/useBoardState";
// Changed import from getOrthogonalPoints to getOrthogonalPath
import { getOrthogonalPath, getAnchorPoint, Rect as UtilsRect } from "@/lib/connection-utils";
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
  duplicateShape: (direction: 'top' | 'right' | 'bottom' | 'left',shouldConnect?: boolean) => void;
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

  // Calculate path data with rounded corners
  const pathData = getOrthogonalPath(startPoint, endPoint, connection.from.side, endSide, 40, 20); // 20px corner radius
  
  const strokeColor = selected ? "#3366FF" : (connection.stroke || "#64748B");
  const strokeWidth = selected ? 4 : (connection.strokeWidth || 4);

  // Calculate arrowhead position and rotation
  const arrowLength = 10;
  let arrowX = endPoint.x;
  let arrowY = endPoint.y;
  let arrowRotation = 0;

  switch (endSide) {
    case "top":
      arrowY -= arrowLength;
      arrowRotation = 90;
      break;
    case "right":
      arrowX += arrowLength;
      arrowRotation = 180;
      break;
    case "bottom":
      arrowY += arrowLength;
      arrowRotation = 270;
      break;
    case "left":
      arrowX -= arrowLength;
      arrowRotation = 0;
      break;
  }

  return (
    <Group onClick={onClick} onTap={onClick}>
      {/* 1. Fat Invisible Path (Click Target) */}
      <Path
        data={pathData}
        stroke="transparent"
        strokeWidth={30}
      />
      
      {/* 2. Visible Rounded Path */}
      <Path
        data={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        dash={connection.id === 'temp-connection' ? [5, 5] : undefined}
        listening={false}
      />

      {/* 3. Arrowhead */}
      <Arrow
        x={arrowX}
        y={arrowY}
        points={[0, 0, arrowLength, 0]} // Simple arrow segment, will be rotated
        rotation={arrowRotation}
        stroke={strokeColor}
        fill={strokeColor}
        strokeWidth={strokeWidth}
        pointerLength={arrowLength}
        pointerWidth={arrowLength}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    </Group>
  );
});
OrthogonalConnection.displayName = "OrthogonalConnection";

const AnchorOverlay = React.memo(({ shape, onMouseDown, onClick, scale }: any) => {
  if (!shape) return null;

  const rect = getNormalizedRect(shape);
  const sides: Side[] = ["top", "right", "bottom", "left"];
  
  const OFFSET = 15 / scale; 
  const HIT_RADIUS = 40 / scale;
  const VISIBLE_RADIUS = 9 / scale;
  const STROKE_WIDTH = 3 / scale;

  return (
    <Group>
      {sides.map(side => {
        const pos = getAnchorPoint(rect, side);
        
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
               onMouseDown(e, side, pos); 
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
            <Circle radius={HIT_RADIUS} fill="transparent" />
            <Circle 
               radius={VISIBLE_RADIUS} 
               fill="#ffffff" 
               stroke="#3366FF" 
               strokeWidth={STROKE_WIDTH} 
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
const ShapeRenderer = React.memo(({ item, isSelected, isEditing, setEditingId, updateShape, commonProps, setShapeRef }: any) => {
  
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
  return (
    prev.item === next.item &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.commonProps.draggable === next.commonProps.draggable 
  );
});
ShapeRenderer.displayName = "ShapeRenderer";



// --- NEW COMPONENT: Quick Actions Overlay ---
const QuickActionsOverlay = React.memo(({ selectedNodeId, allShapesMap, onDuplicate, scale }: any) => {
  const shape = allShapesMap.get(selectedNodeId);
  if (!shape) return null;

  const rect = getNormalizedRect(shape);
  const { x, y, width, height } = rect;

  const GAP = 35 / scale; 
  const BUTTON_SIZE = 28 / scale;
  const VISIBLE_RADIUS = 12 / scale;
  const HALF_BTN = BUTTON_SIZE / 2;
  const ICON_SIZE = 5 / scale;
  const STROKE_WIDTH = 2 / scale;

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
          y={action.dir === 'top' || action.dir === 'bottom' ? action.y - HALF_BTN : action.y - HALF_BTN}
        >
          <Circle
            radius={BUTTON_SIZE}
            fill="transparent"
            onClick={(e) => {
               e.cancelBubble = true;
               onDuplicate(action.dir,true);
            }}
            onMouseEnter={(e) => {
               const container = e.target.getStage()?.container();
               if(container) container.style.cursor = "pointer";
               const group = e.target.getParent() as Konva.Group;
               group?.findOne('.visible-btn')?.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 });
               group?.findOne('.plus-icon')?.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 });
            }}
            onMouseLeave={(e) => {
               const container = e.target.getStage()?.container();
               if(container) container.style.cursor = "default";
               const group = e.target.getParent() as Konva.Group;
               group?.findOne('.visible-btn')?.to({ scaleX: 1, scaleY: 1, duration: 0.1 });
               group?.findOne('.plus-icon')?.to({ scaleX: 1, scaleY: 1, duration: 0.1 });
            }}
          />
          
          <Circle
            name="visible-btn"
            radius={VISIBLE_RADIUS}
            fill="#3366FF"
            opacity={1} 
            listening={false}
          />
          
          <Group name="plus-icon" listening={false}>
             <Line points={[-ICON_SIZE, 0, ICON_SIZE, 0]} stroke="white" strokeWidth={STROKE_WIDTH} listening={false} />
             <Line points={[0, -ICON_SIZE, 0, ICON_SIZE]} stroke="white" strokeWidth={STROKE_WIDTH} listening={false} />
          </Group>
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

  const allShapesMap = useMemo(() => {
    const map = new Map();
    [...shapes, ...reactShapes, ...images, ...stageFrames].forEach(s => map.set(s.id, s));
    return map;
  }, [shapes, reactShapes, images, stageFrames]);

  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node) return;
    if (!selectedNodeIds.includes(node.id())) {
       setSelectedNodeIds([node.id()]);
    }
    const startPositions = new Map<string, {x:number, y:number}>();
    selectedNodeIds.forEach(id => {
       const ref = shapeRefs.current[id];
       if (ref) startPositions.set(id, { x: ref.x(), y: ref.y() });
    });
    startPositions.set(node.id(), { x: node.x(), y: node.y() });
    dragStartPos.current = startPositions;
  }, [selectedNodeIds, setSelectedNodeIds]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const startPos = dragStartPos.current.get(node.id());
    if (!startPos) return;
    const dx = node.x() - startPos.x;
    const dy = node.y() - startPos.y;
    selectedNodeIds.forEach(id => {
      if (id === node.id()) return;
      const otherNode = shapeRefs.current[id];
      const otherStart = dragStartPos.current.get(id);
      if (otherNode && otherStart) {
        otherNode.x(otherStart.x + dx);
        otherNode.y(otherStart.y + dy);
      }
    });
   if (trRef.current) trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const startPos = dragStartPos.current.get(node.id());
    if(!startPos) return;
    const dx = node.x() - startPos.x;
    const dy = node.y() - startPos.y;
    const applyMove = (list: any[], setter: any) => {
        const affected = list.filter(item => selectedNodeIds.includes(item.id));
        if (affected.length === 0) return;
        setter((prev: any[]) => prev.map(item => {
            if (selectedNodeIds.includes(item.id)) {
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

  const handleShapeTransformEnd = useCallback((item: any, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    const updates: any = { x: node.x(), y: node.y(), rotation: node.rotation() };
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

  useEffect(() => {
    if (!trRef.current) return;
    if (selectedNodeIds.length === 0) {
      trRef.current.nodes([]);
      return;
    }
    const nodes = selectedNodeIds.map(id => shapeRefs.current[id]).filter((n): n is Konva.Node => !!n);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds, shapes, reactShapes, images, stageFrames]); 

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
        className="bg-slate-50"
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}
      >
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
                    onDragMove: handleDragMove,
                    onDragEnd: handleDragEnd,
                    onTransformEnd: (e: any) => handleShapeTransformEnd(item, e),
                    onMouseEnter: (item.type === 'text' || item.type === 'stickyNote') 
                        ? undefined 
                        : () => setHoveredNodeId(item.id),
                    onMouseLeave: () => setHoveredNodeId(null),
                }}
             />
          ))}

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

          {tempConnection && (
            <OrthogonalConnection 
                connection={tempConnection} 
                fromShape={allShapesMap.get(tempConnection.from.nodeId)}
                toShape={tempConnection.to.nodeId ? allShapesMap.get(tempConnection.to.nodeId) : null}
            />
          )}

          {hoveredNodeId && activeTool === "connect" && allShapesMap.has(hoveredNodeId) && (
            <AnchorOverlay 
                shape={allShapesMap.get(hoveredNodeId)}
                scale={scale}
                onMouseDown={(e: any, side: Side, pos: any) => handleAnchorMouseDown(e, hoveredNodeId, side, pos)}
                onClick={(e: any, side: Side) => handleAnchorClick(e, hoveredNodeId, side)}
            />
          )}
          
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
                listening={false}
            />
          ))}

          {(() => {
            const selectedNode = selectedNodeIds.length === 1 ? allShapesMap.get(selectedNodeIds[0]) : null;
            const shouldHideAnchors = selectedNode && (selectedNode.type === 'stickyNote' || selectedNode.type === 'stage');
            return (
              <Transformer 
                ref={trRef}
                resizeEnabled={!shouldHideAnchors}
                rotateEnabled={!shouldHideAnchors}
                borderStroke="#3366FF"
                borderStrokeWidth={1.5}
                anchorSize={11}
                anchorCornerRadius={6}
                anchorStroke="#3366FF"
                anchorFill="#FFFFFF"
                anchorStrokeWidth={1.5}
                rotationSnaps={[0, 90, 180, 270]}
                padding={8}
                ignoreStroke={true}
              />
            );
          })()}

          {selectedNodeIds.length === 1 && !isSpacePressed && (
             <QuickActionsOverlay 
                selectedNodeId={selectedNodeIds[0]} 
                allShapesMap={allShapesMap} 
                scale={scale}
                onDuplicate={duplicateShape}
             />
          )}

        </Layer>
      </Stage>
    </div>
  );
};

export default StageComponent;