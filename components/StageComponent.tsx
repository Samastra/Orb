// components/StageComponent.tsx
import React, { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Konva from "konva";
import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, RegularPolygon, Image, Path, Group } from "react-konva";
import GridLayer from "@/components/gridLayer";
import { ReactShape, Tool, ImageShape } from "../types/board-types";
import TextComponent from "./TextComponent";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";
import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

// Dynamic import for Stage
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), {
  ssr: false,
});

// Helper type to fix MouseEvent vs TouchEvent conflicts
type KonvaPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;

// Helper to safely check for modifier keys
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
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
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
  
  // --- UPDATED TEXT PROPS ---
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onTextCreate: (pos: { x: number; y: number }) => void;
  
  handleStartTextEditing?: (textProps: {
    position: { x: number; y: number };
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    width: number;
    onSave: (text: string) => void;
  }) => void;
}

type CombinedShape =
  | (KonvaShape & { __kind: 'konva' })
  | (ReactShape & { __kind: 'react' })
  | (KonvaShape & { __kind: 'stage' })
  | (ImageShape & { __kind: 'image' })
  | (Connection & { __kind: 'connection' });

// Image Component
const ImageElement = React.forwardRef<Konva.Image, {
  imageShape: ImageShape;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}>(({
  imageShape,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd
}, ref) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const internalRef = React.useRef<Konva.Image>(null);

  React.useImperativeHandle(ref, () => internalRef.current!);
  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageShape.src;
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageShape.src);
    };
  }, [imageShape.src]);
  
  if (!image) {
    return (
      <Rect
        ref={internalRef as React.RefObject<Konva.Rect>}
        x={imageShape.x}
        y={imageShape.y}
        width={imageShape.width || 200}
        height={imageShape.height || 150}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        draggable={imageShape.draggable}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        name="selectable-shape"
        id={imageShape.id}
      />
    );
  }
  
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

// Connection Component
const ConnectionElement = React.forwardRef<Konva.Path, {
  connection: Connection;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (e: KonvaPointerEvent) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  onDelete: (id: string) => void;
}>(({
  connection,
  onDragEnd,
  onClick,
  updateConnection,
  onDelete
}, ref) => {
  const groupRef = React.useRef<Konva.Group>(null);
  const pathRef = React.useRef<Konva.Path>(null);
  const startAnchorRef = React.useRef<Konva.Circle>(null);
  const endAnchorRef = React.useRef<Konva.Circle>(null);

  React.useImperativeHandle(ref, () => pathRef.current!);
  
  const computeSmartControlPoints = (from: {x: number, y: number}, to: {x: number, y: number}) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const shouldSnapStraight = Math.abs(dy) < 15;
    if (shouldSnapStraight) {
      return {
        cp1x: from.x,
        cp1y: from.y,
        cp2x: to.x,
        cp2y: to.y,
        shouldSnapStraight: true
      };
    }
    const midX = from.x + dx / 2;
    return {
      cp1x: midX,
      cp1y: from.y,
      cp2x: midX,
      cp2y: to.y,
      shouldSnapStraight: false
    };
  };
  
  const buildPathData = (from: {x: number, y: number}, to: {x: number, y: number}, cp1x: number, cp1y: number, cp2x: number, cp2y: number, snapStraight: boolean) => {
    if (snapStraight) {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  };
  
  const updatePathFromAnchors = () => {
    if (!startAnchorRef.current || !endAnchorRef.current || !pathRef.current) return;
    const fx = startAnchorRef.current.x();
    const fy = startAnchorRef.current.y();
    const tx = endAnchorRef.current.x();
    const ty = endAnchorRef.current.y();
    const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints({x: fx, y: fy}, {x: tx, y: ty});
    const d = buildPathData({x: fx, y: fy}, {x: tx, y: ty}, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
    pathRef.current.data(d);
    pathRef.current.getLayer()?.batchDraw();
    updateConnection(connection.id, {
      from: { ...connection.from, x: fx, y: fy },
      to: { ...connection.to, x: tx, y: ty },
      cp1x, cp1y, cp2x, cp2y
    });
  };
  
  React.useEffect(() => {
    if (!groupRef.current || !pathRef.current || !startAnchorRef.current || !endAnchorRef.current) return;
    startAnchorRef.current.on('dragmove', updatePathFromAnchors);
    endAnchorRef.current.on('dragmove', updatePathFromAnchors);
    return () => {
      startAnchorRef.current?.off('dragmove', updatePathFromAnchors);
      endAnchorRef.current?.off('dragmove', updatePathFromAnchors);
    };
  }, []);
  
  const pathData = buildPathData(
    connection.from,
    connection.to,
    connection.cp1x,
    connection.cp1y,
    connection.cp2x,
    connection.cp2y,
    Math.abs(connection.to.y - connection.from.y) < 15
  );
  
  const anchorRadius = 6;
  return (
    <Group
      ref={groupRef}
      id={connection.id}
      name="selectable-shape connection-group"
      draggable={connection.draggable}
      onDragEnd={onDragEnd}
      onDblClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        console.log('🗑️ Double-click on connection:', connection.id);
        onDelete(connection.id);
      }}
      onDblTap={(e: Konva.KonvaEventObject<Event>) => {
        e.cancelBubble = true;
        console.log('🗑️ Double-tap on connection:', connection.id);
        onDelete(connection.id);
      }}
    >
      <Path
        ref={pathRef}
        data={pathData}
        stroke={connection.stroke || '#333'}
        strokeWidth={connection.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        listening={true}
        onClick={onClick}
        onTap={onClick}
        name="connection-path"
      />
      <Circle
        ref={startAnchorRef}
        x={connection.from.x}
        y={connection.from.y}
        radius={anchorRadius}
        fill="#007AFF"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={true}
        name="connection-anchor tail-anchor"
      />
      <Circle
        ref={endAnchorRef}
        x={connection.to.x}
        y={connection.to.y}
        radius={anchorRadius}
        fill="#FF3B30"
        stroke="#ffffff"
        strokeWidth={2}
        draggable={true}
        name="connection-anchor head-anchor"
      />
    </Group>
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
  selectedNodeIds,
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
  hasLoaded,
  setSelectedNodeIds,
  setReactShapes,
  setShapes,
  setImages,
  setConnections,
  setStageFrames,
  updateShape,
  setStageInstance,
  updateConnection,
  onDelete,
  setActiveTool,
  handleStartTextEditing,
  // --- PROPS ---
  editingId,
  setEditingId,
  onTextCreate
}) => {
  // Use a Mutable Object Map instead of useEffect for refs
  // This is CRITICAL for instant availability of refs for new shapes
  const shapeRefs = useRef<{ [key: string]: Konva.Node | null }>({});
  const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Helper to assign refs dynamically
  const setShapeRef = (id: string, node: Konva.Node | null) => {
    if (node) {
      shapeRefs.current[id] = node;
    } else {
      delete shapeRefs.current[id];
    }
  };

  // Ensure Konva nodes match loaded state (Sanity Check)
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    requestAnimationFrame(() => {
      const allShapes = [...shapes, ...reactShapes, ...images, ...stageFrames];
      stage.find('[id]').forEach(node => {
        const id = node.id();
        const saved = allShapes.find(s => s.id === id);
        if (saved && 'x' in saved && 'y' in saved) {
          node.x(saved.x);
          node.y(saved.y);
        }
        if (saved && 'rotation' in saved) {
          node.rotation(saved.rotation || 0);
        }
      });
      stage.batchDraw();
    });
  }, [shapes, reactShapes, images, stageFrames, stageRef]);

  useEffect(() => {
    Konva.hitOnDragEnabled = false;
  }, []);

  // ========== MULTI-SELECTION DRAG HANDLERS ==========
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node || selectedNodeIds.length <= 1) return;

    selectedNodeIds.forEach(id => {
      // Access refs directly from the map
      const ref = shapeRefs.current[id];
      if (ref && ref !== node) {
        dragStartPos.current.set(id, { x: ref.x(), y: ref.y() });
      }
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
      const other = shapeRefs.current[id]; // Access directly
      if (other) {
        const start = dragStartPos.current.get(id);
        if (start) {
          other.x(start.x + dx);
          other.y(start.y + dy);
        }
      }
    });

    if (trRef.current) trRef.current.forceUpdate();
  }, [selectedNodeIds, trRef]);

  // ========== SINGLE DRAG END HANDLER (Fixes Monkey Dance) ==========
  const handleSingleDragEnd = useCallback((item: CombinedShape, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    if (item.__kind === 'react') {
      setReactShapes(prev => prev.map(s => s.id === item.id ? { ...s, x: newX, y: newY } : s));
    } else if (item.__kind === 'konva') {
      setShapes(prev => prev.map(s => s.id === item.id ? { ...s, x: newX, y: newY } : s));
    } else if (item.__kind === 'image') {
      setImages(prev => prev.map(i => i.id === item.id ? { ...i, x: newX, y: newY } : i));
    } else if (item.__kind === 'stage') {
      setStageFrames(prev => prev.map(f => f.id === item.id ? { ...f, x: newX, y: newY } : f));
    }
    dragStartPos.current.delete(item.id);
  }, [setReactShapes, setShapes, setImages, setStageFrames]);

  // ========== MULTI-DRAG END HANDLER ==========
  const handleMultiDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (selectedNodeIds.length <= 1) return;

    const node = e.target;
    const finalX = node.x();
    const finalY = node.y();
    const start = dragStartPos.current.get(node.id());
    if (!start) return;

    const dx = finalX - start.x;
    const dy = finalY - start.y;

    selectedNodeIds.forEach(id => {
      const startPos = dragStartPos.current.get(id);
      if (!startPos) return;

      const newX = startPos.x + dx;
      const newY = startPos.y + dy;

      if (reactShapes.some(s => s.id === id)) {
        setReactShapes(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
      } else if (shapes.some(s => s.id === id)) { 
        setShapes(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
      } else if (images.some(i => i.id === id)) {
        setImages(prev => prev.map(i => i.id === id ? { ...i, x: newX, y: newY } : i));
      } else if (stageFrames.some(f => f.id === id)) {
        setStageFrames(prev => prev.map(f => f.id === id ? { ...f, x: newX, y: newY } : f));
      }
    });

    dragStartPos.current.clear();
  }, [selectedNodeIds, reactShapes, shapes, images, stageFrames, setReactShapes, setShapes, setImages, setStageFrames]);

  // ========== TRANSFORM HANDLER (Fixes Arrow Scaling) ==========
  const handleShapeTransformEnd = (item: CombinedShape, e: Konva.KonvaEventObject<Event>) => {
    try {
      const node = e.target;
      if (item.__kind === 'connection') return;
      
      const hasPosition = (shape: CombinedShape): shape is CombinedShape & { x: number; y: number } => {
        return shape.__kind !== 'connection';
      };
      if (!hasPosition(item)) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      node.scaleX(1);
      node.scaleY(1);

      const commonAttrs = { x: node.x(), y: node.y(), rotation: node.rotation() };
      
      if (item.__kind === 'react') {
        const updates: Partial<ReactShape> = { ...commonAttrs };
        if (item.type === 'text') {
          const textItem = item as ReactShape;
          updates.width = Math.max(20, (textItem.width ?? 200) * scaleX);
          updates.fontSize = Math.max(8, (textItem.fontSize ?? 20) * scaleY);
        } else if (item.type === 'stickyNote') {
          const stickyItem = item as ReactShape;
          updates.width = Math.max(50, (stickyItem.width ?? 200) * scaleX);
          updates.height = Math.max(50, (stickyItem.height ?? 200) * scaleY);
          if (stickyItem.fontSize) {
            updates.fontSize = Math.max(8, stickyItem.fontSize * scaleY);
          }
        }
        setReactShapes(prev => prev.map(s => s.id === item.id ? { ...s, ...updates } : s));
        return;
      }
      
      if (item.__kind === 'image') {
        const imageNode = node as Konva.Image;
        setImages(prev => prev.map(img =>
          img.id === item.id ? { ...img, ...commonAttrs, width: Math.max(1, imageNode.width() * scaleX), height: Math.max(1, imageNode.height() * scaleY) } : img
        ));
        return;
      }
      
      if (item.__kind === 'stage') {
        const stageNode = node as Konva.Rect;
        setStageFrames(prev => prev.map(f => f.id === item.id ? { ...f, ...commonAttrs, width: Math.max(1, stageNode.width() * scaleX), height: Math.max(1, stageNode.height() * scaleY) } : f));
        return;
      }
      
      if (item.__kind === 'konva') {
        const k = item as KonvaShape;
        const updates: Partial<KonvaShape> = { ...commonAttrs };

        switch (k.type) {
          case 'rect':
            updates.width = Math.max(1, (k.width ?? 100) * scaleX);
            updates.height = Math.max(1, (k.height ?? 100) * scaleY);
            break;
          case 'circle':
          case 'triangle':
            const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
            updates.radius = Math.max(1, (k.radius ?? 50) * avgScale);
            break;
          case 'ellipse':
            updates.radiusX = Math.max(1, (k.radiusX ?? 80) * scaleX);
            updates.radiusY = Math.max(1, (k.radiusY ?? 50) * scaleY);
            break;
          case 'arrow':
            if (k.points) {
               updates.points = k.points.map((val, index) => index % 2 === 0 ? val * scaleX : val * scaleY);
               const arrowScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
               
               // Use proper property access
               const pLength = k.pointerLength ?? 10;
               const pWidth = k.pointerWidth ?? 10;
               
               updates.pointerLength = pLength * arrowScale;
               updates.pointerWidth = pWidth * arrowScale;
            }
            break;
          default:
            // Safe property check without 'any'
            if ('width' in k && typeof k.width === 'number') {
               updates.width = k.width * scaleX;
            }
            if ('height' in k && typeof k.height === 'number') {
               updates.height = k.height * scaleY;
            }
            break;
        }
        updateShape(item.id, updates);
        return;
      }
    } catch (error) {
      console.error('Error in handleShapeTransformEnd:', error);
    }
  };

  useEffect(() => {
      if (!stageRef.current) return;
      const stage = stageRef.current;
      stage.scale({ x: scale, y: scale });
      stage.position(position);
      stage.batchDraw();
    }, [scale, position, stageRef]);

  // UPDATED: Sync selection to Transformer using safe ref access

  useEffect(() => {
    if (!trRef.current) return;

    if (selectedNodeIds.length === 0) {
      trRef.current.nodes([]);
      return;
    }

    // THE FIX: Filter OUT any ID that belongs to a Stage Frame
    const nodes = selectedNodeIds
      .filter(id => !stageFrames.some(frame => frame.id === id)) // <--- This line prevents the Transformer from attaching
      .map(id => shapeRefs.current[id])
      .filter((n): n is Konva.Node => !!n);

    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds, trRef, reactShapes, shapes, images, stageFrames]);

  const allShapesToRender = React.useMemo(() => {
    return [
      ...stageFrames.map(s => ({ ...s, __kind: 'stage' as const })),
      ...shapes.map(s => ({ ...s, __kind: 'konva' as const })),
      ...images.map(s => ({ ...s, __kind: 'image' as const })),
      ...connections.map(s => ({ ...s, __kind: 'connection' as const })),
      ...reactShapes.map(s => ({ ...s, __kind: 'react' as const })),
    ];
  }, [stageFrames, shapes, reactShapes, images, connections]);

  const handleStageClick = (e: KonvaPointerEvent) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    // 1. Check if we clicked on empty stage
    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      // MIRO LOGIC: If Text Tool is active + Click Empty Space -> Create Text
      if (activeTool === "text") {
        const pos = stage.getRelativePointerPosition();
        if (pos) {
          onTextCreate({ x: pos.x, y: pos.y });
        }
        return;
      }

      // Normal Select Logic: Deselect if clicking empty
      setSelectedNodeIds([]);
      setEditingId(null); 
      return;
    }
    
    // 2. Handle Clicking on Shapes
    if (e.target.hasName('selectable-shape')) {
      const clickedId = e.target.id();
      const evt = e.evt; // native event
      
      // Type safe check for modifier keys
      const isMultiSelect = isMouseEvent(evt) 
        ? evt.shiftKey || evt.ctrlKey || evt.metaKey 
        : false;
      
      if (isMultiSelect) {
        if (selectedNodeIds.includes(clickedId)) {
          setSelectedNodeIds((prev: string[]) => prev.filter((id: string) => id !== clickedId));
        } else {
          setSelectedNodeIds((prev: string[]) => [...prev, clickedId]);
        }
      } else {
        setSelectedNodeIds([clickedId]);
      }
    }
  };

  const handleShapeClick = (item: CombinedShape, e: KonvaPointerEvent) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      const clickedId = item.id;
      const evt = e.evt;
      
      // Type safe check for modifier keys
      const isMultiSelect = isMouseEvent(evt) 
        ? evt.shiftKey || evt.ctrlKey || evt.metaKey 
        : false;
      
      if (isMultiSelect) {
        if (selectedNodeIds.includes(clickedId)) {
          setSelectedNodeIds((prev: string[]) => prev.filter((id: string) => id !== clickedId));
        } else {
          setSelectedNodeIds((prev: string[]) => [...prev, clickedId]);
        }
      } else {
        setSelectedNodeIds([clickedId]);
      }
    }
  };

  const handleConnectionClick = (connection: Connection, e: KonvaPointerEvent) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      const clickedId = connection.id;
      const evt = e.evt;
      
      // Type safe check for modifier keys
      const isMultiSelect = isMouseEvent(evt) 
        ? evt.shiftKey || evt.ctrlKey || evt.metaKey 
        : false;
      
      if (isMultiSelect) {
        if (selectedNodeIds.includes(clickedId)) {
          setSelectedNodeIds((prev: string[]) => prev.filter((id: string) => id !== clickedId));
        } else {
          setSelectedNodeIds((prev: string[]) => [...prev, clickedId]);
        }
      } else {
        setSelectedNodeIds([clickedId]);
      }
    }
  };

  const handleImageDragEnd = (imageShape: ImageShape, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Image;
    const wasResized = node.width() !== imageShape.width || node.height() !== imageShape.height;
    
    if (wasResized) {
      setImages((prev: ImageShape[]) => prev.map((img: ImageShape) =>
        img.id === imageShape.id ? { ...img, x: node.x(), y: node.y(), width: node.width(), height: node.height() } : img
      ));
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <Stage
        width={width || (typeof window !== "undefined" ? window.innerWidth : 3072)}
        height={height || (typeof window !== "undefined" ? window.innerHeight : 2048)}
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
        draggable={false}
      >
        <GridLayer 
          stage={stageInstance} 
          baseSize={40}  // 40 is a good "tight" dot grid like Canva
          color="#cfcfcf" // Light grey
          size={1.5}     // 1.5 or 2 makes it clear but subtle
      />
        <Layer name="draw-layer">
          {allShapesToRender.map((item) => {
            // Callback Ref for EVERY shape - Ensures Refs are always up to date
            const refCallback = (node: Konva.Node | null) => setShapeRef(item.id, node);

            const commonProps = {
              id: item.id,
              draggable: (item.draggable ?? true) && activeTool === "select",
              name: 'selectable-shape',
              onClick: (e: KonvaPointerEvent) => handleShapeClick(item, e),
              onTap: (e: KonvaPointerEvent) => handleShapeClick(item, e),
              onDragStart: handleDragStart,
              onDragMove: handleDragMove,
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                  if (selectedNodeIds.length > 1 && selectedNodeIds.includes(item.id)) {
                      handleMultiDragEnd(e);
                  } else {
                      handleSingleDragEnd(item, e);
                  }
              }
            };

            const extraProps = (item.__kind !== 'connection') ? { x: (item as any).x, y: (item as any).y } : {};

            if (item.__kind === 'stage') {
              const stageItem = item as KonvaShape;
              return (
                <Rect
                  key={item.id}
                  ref={refCallback} // Use callback ref
                  {...commonProps}
                  {...extraProps}
                  width={stageItem.width ?? 800}
                  height={stageItem.height ?? 600}
                  fill={stageItem.fill || "#ffffff"}
                  stroke={stageItem.stroke || "#cccccc"}
                  strokeWidth={stageItem.strokeWidth || 2}
                  cornerRadius={0}
                  onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                  name="stage-frame"
                />
              );
            } else if (item.__kind === 'image') {
              const imageItem = item as ImageShape;
              return (
                <ImageElement
                  key={item.id}
                  ref={refCallback} // Use callback ref
                  imageShape={imageItem}
                  onDragStart={commonProps.onDragStart}
                  onDragMove={commonProps.onDragMove}
                  onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                    commonProps.onDragEnd(e);
                    handleImageDragEnd(imageItem, e);
                  }}
                  onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                />
              );
            } else if (item.__kind === 'connection') {
              const connectionItem = item as Connection;
              return (
                <ConnectionElement
                  key={item.id}
                  ref={refCallback} // Use callback ref
                  connection={connectionItem}
                  onDragEnd={commonProps.onDragEnd}
                  onClick={(e: KonvaPointerEvent) => handleConnectionClick(connectionItem, e)}
                  updateConnection={updateConnection}
                  onDelete={onDelete}
                />
              );
            } else if (item.__kind === 'konva') {
              const konvaItem = item as KonvaShape;
              switch (item.type) {
                case 'rect':
                  return <Rect key={item.id} ref={refCallback} {...commonProps} {...extraProps} width={konvaItem.width ?? 100} height={konvaItem.height ?? 100} fill={konvaItem.fill} cornerRadius={konvaItem.cornerRadius ?? 0} stroke={konvaItem.stroke} strokeWidth={konvaItem.strokeWidth ?? 0} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)} />;
                case 'circle':
                  return <Circle key={item.id} ref={refCallback} {...commonProps} {...extraProps} radius={konvaItem.radius ?? 50} fill={konvaItem.fill} stroke={konvaItem.stroke} strokeWidth={konvaItem.strokeWidth ?? 0} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)} />;
                case 'ellipse':
                  return <Ellipse key={item.id} ref={refCallback} {...commonProps} {...extraProps} radiusX={konvaItem.radiusX ?? 80} radiusY={konvaItem.radiusY ?? 50} fill={konvaItem.fill} stroke={konvaItem.stroke} strokeWidth={konvaItem.strokeWidth ?? 0} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)} />;
                case 'triangle':
                  return <RegularPolygon key={item.id} ref={refCallback} {...commonProps} {...extraProps} sides={3} radius={konvaItem.radius ?? 50} fill={konvaItem.fill} stroke={konvaItem.stroke} strokeWidth={konvaItem.strokeWidth ?? 0} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)} />;
                case 'arrow':
                  return <Arrow key={item.id} ref={refCallback} {...commonProps} {...extraProps} points={(konvaItem.points as number[]) ?? [0, 0, 100, 0]} stroke={konvaItem.fill ?? konvaItem.stroke} fill={konvaItem.fill} strokeWidth={konvaItem.strokeWidth ?? 2} pointerLength={konvaItem.pointerLength ?? 10} pointerWidth={konvaItem.pointerWidth ?? 10} onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)} />;
                default:
                  return null;
              }
            } else if (item.__kind === 'react') {
              if (item.type === 'text') {
                const textItem = item as ReactShape;
                const isEditingThisNode = editingId === item.id;
                return (
                  <TextComponent
                    key={item.id}
                    ref={refCallback} // Use callback ref
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    text={textItem.text ?? ""}
                    fontSize={textItem.fontSize ?? 20}
                    fill={textItem.fill ?? "black"}
                    fontFamily={textItem.fontFamily ?? "Inter, Arial, sans-serif"}
                    fontWeight={textItem.fontWeight ?? "normal"}
                    fontStyle={textItem.fontStyle ?? "normal"}
                    activeTool={activeTool}
                    align={(textItem.align as "left" | "center" | "right") ?? "left"}
                    width={textItem.width ?? 200}
                    rotation={textItem.rotation ?? 0}
                    isSelected={selectedNodeIds.includes(item.id)}
                    isEditing={isEditingThisNode}
                    onSelect={() => activeTool === "select" && setSelectedNodeIds([item.id])}
                    onUpdate={(newAttrs: Partial<ReactShape>) => setReactShapes(prev => prev.map(shape => shape.id === item.id ? { ...shape, ...newAttrs } : shape))}
                    onStartEditing={() => {
                        setSelectedNodeIds([item.id]);
                        setEditingId(item.id);
                    }}
                    onFinishEditing={() => setEditingId(null)}
                    onDelete={onDelete} 
                    onDragStart={commonProps.onDragStart}
                    onDragMove={commonProps.onDragMove}
                    onDragEnd={commonProps.onDragEnd}
                    onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                  />
                );
              } else if (item.type === 'stickyNote') {
                return (
                  <EditableStickyNoteComponent
                    key={item.id}
                    ref={refCallback} // Use callback ref
                    shapeData={item as ReactShape}
                    isSelected={selectedNodeIds.includes(item.id)}
                    activeTool={activeTool}
                    onSelect={() => activeTool === "select" && setSelectedNodeIds([item.id])}
                    onUpdate={(newAttrs: Partial<ReactShape>) => setReactShapes(prev => prev.map(shape => shape.id === item.id ? { ...shape, ...newAttrs } : shape))}
                    onDragStart={commonProps.onDragStart}
                    onDragMove={commonProps.onDragMove}
                    onDragEnd={commonProps.onDragEnd}
                  />
                );
              }
            }
            return null;
          })}
          {lines.map((line, i) => (
            <Line key={`line-${i}`} points={line.points} stroke={line.tool === 'brush' ? '#000000' : '#ffffff'} strokeWidth={5} tension={0.5} lineCap="round" lineJoin="round" globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'} listening={false} />
          ))}
          <Transformer
            ref={trRef}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right","top-center", "bottom-center", "middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (selectedNodeIds.length > 1) return newBox;
              const selectedShapes = allShapesToRender.filter(item => selectedNodeIds.includes(item.id));
              const selectedImage = selectedShapes.find(item => item.__kind === 'image');
              if (selectedImage) {
                const imageShape = selectedImage as ImageShape;
                const aspectRatio = imageShape.width / imageShape.height;
                let width = newBox.width;
                let height = newBox.height;
                if (Math.abs(width - oldBox.width) > Math.abs(height - oldBox.height)) height = width / aspectRatio;
                else width = height * aspectRatio;
                return { ...newBox, width: Math.max(20, width), height: Math.max(20, height) };
              }
              return { ...newBox, width: Math.max(5, newBox.width), height: Math.max(5, newBox.height) };
            }}
            keepRatio={selectedNodeIds.length === 1}
            rotateEnabled={true}
            resizeEnabled={true}
            anchorSize={12}
            anchorStrokeWidth={1}
            borderStroke="#0099e5"
            borderStrokeWidth={2}
            anchorCornerRadius={6}
            anchorStroke="#0099e5"
            anchorFill="#ffffff"
            ignoreStroke={true}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default StageComponent;