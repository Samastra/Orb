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
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
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
}) => {
  const shapeRefs = useRef<{ [key: string]: React.RefObject<Konva.Node | null> }>({});
  const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Disable hit detection during drag for performance
  useEffect(() => {
    Konva.hitOnDragEnabled = false;
  }, []);

  // ========== FIXED: UNIFIED MULTI-SELECTION DRAG HANDLERS ==========
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node || selectedNodeIds.length <= 1) return;

    // Store original positions of ALL selected nodes
    selectedNodeIds.forEach(id => {
      const ref = shapeRefs.current[id]?.current;
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
      const other = shapeRefs.current[id]?.current;
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

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (selectedNodeIds.length <= 1) {
      // Single drag — let individual components handle it
      return;
    }

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

      const shape = [...shapes, ...reactShapes, ...images, ...stageFrames].find(s => s.id === id);
      if (!shape) return;

      const newX = startPos.x + dx;
      const newY = startPos.y + dy;

      if ('__kind' in shape && shape.__kind === 'react') {
        setReactShapes(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
      } else if ('type' in shape && (shape as KonvaShape | ImageShape).type === 'image') {
        setImages(prev => prev.map(i => i.id === id ? { ...i, x: newX, y: newY } : i));
      } else if ('type' in shape && (shape as KonvaShape).type === 'stage') {
        setStageFrames(prev => prev.map(f => f.id === id ? { ...f, x: newX, y: newY } : f));
      } else {
        updateShape(id, { x: newX, y: newY });
      }
    });

    dragStartPos.current.clear();
  }, [selectedNodeIds, shapes, reactShapes, images, stageFrames, setReactShapes, setImages, setStageFrames, updateShape]);

  // Common drag props for multi-selection
  const commonDragProps = {
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  };

  // ========== EXISTING HANDLE SHAPE TRANSFORM END ==========
  const handleShapeTransformEnd = (item: CombinedShape, e: Konva.KonvaEventObject<Event>) => {
    try {
      const node = e.target;
      if (item.__kind === 'connection') return;
      
      const hasPosition = (shape: CombinedShape): shape is CombinedShape & { x: number; y: number } => {
        return shape.__kind !== 'connection';
      };
      if (!hasPosition(item)) return;
      
      if (item.__kind === 'react') {
        const newX = node.x();
        const newY = node.y();
        const newRotation = node.rotation();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const updates: Partial<ReactShape> = { x: newX, y: newY, rotation: newRotation };
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
        node.scaleX(1);
        node.scaleY(1);
        setReactShapes(prev => prev.map(s => s.id === item.id ? { ...s, ...updates } : s));
        return;
      }
      
      if (item.__kind === 'image') {
        const imageNode = node as Konva.Image;
        const newWidth = Math.max(1, imageNode.width() * imageNode.scaleX());
        const newHeight = Math.max(1, imageNode.height() * imageNode.scaleY());
        imageNode.scaleX(1);
        imageNode.scaleY(1);
        
        setImages(prev => prev.map(img =>
          img.id === item.id
            ? {
                ...img,
                x: imageNode.x(),
                y: imageNode.y(),
                width: newWidth,
                height: newHeight,
                rotation: imageNode.rotation()
              }
            : img
        ));
        return;
      }
      
      if (item.__kind === 'stage') {
        const stageNode = node as Konva.Rect;
        const newWidth = Math.max(1, stageNode.width() * stageNode.scaleX());
        const newHeight = Math.max(1, stageNode.height() * stageNode.scaleY());
        stageNode.scaleX(1);
        stageNode.scaleY(1);
        updateShape(item.id, {
          x: stageNode.x(),
          y: stageNode.y(),
          width: newWidth,
          height: newHeight,
          rotation: stageNode.rotation()
        });
        return;
      }
      
      if (item.__kind === 'konva') {
        const k = item as KonvaShape;
        switch (k.type) {
          case 'rect': {
            const rectNode = node as Konva.Rect;
            const newW = Math.max(1, rectNode.width() * rectNode.scaleX());
            const newH = Math.max(1, rectNode.height() * rectNode.scaleY());
            rectNode.scaleX(1);
            rectNode.scaleY(1);
            updateShape(item.id, {
              x: rectNode.x(),
              y: rectNode.y(),
              width: newW,
              height: newH,
              rotation: rectNode.rotation()
            });
            break;
          }
          case 'circle': {
            const circleNode = node as Konva.Circle;
            const newR = Math.max(1, circleNode.radius() * circleNode.scaleX());
            circleNode.scaleX(1);
            circleNode.scaleY(1);
            updateShape(item.id, {
              x: circleNode.x(),
              y: circleNode.y(),
              radius: newR,
              rotation: circleNode.rotation()
            });
            break;
          }
          case 'ellipse': {
            const ellipseNode = node as Konva.Ellipse;
            const newRx = Math.max(1, ellipseNode.radiusX() * ellipseNode.scaleX());
            const newRy = Math.max(1, ellipseNode.radiusY() * ellipseNode.scaleY());
            ellipseNode.scaleX(1);
            ellipseNode.scaleY(1);
            updateShape(item.id, {
              x: ellipseNode.x(),
              y: ellipseNode.y(),
              radiusX: newRx,
              radiusY: newRy,
              rotation: ellipseNode.rotation()
            });
            break;
          }
          case 'triangle':
          case 'arrow':
          default: {
            const newAttrs: Partial<KonvaShape> = {
              x: node.x(),
              y: node.y(),
              rotation: node.rotation()
            };
            if ('width' in node.attrs && 'height' in node.attrs) {
              const shapeNode = node as Konva.Shape;
              const newW = Math.max(1, shapeNode.width() * shapeNode.scaleX());
              const newH = Math.max(1, shapeNode.height() * shapeNode.scaleY());
              shapeNode.scaleX(1);
              shapeNode.scaleY(1);
              newAttrs.width = newW;
              newAttrs.height = newH;
            }
            updateShape(item.id, newAttrs);
            break;
          }
        }
        return;
      }
    } catch (error) {
      console.error('Error in handleShapeTransformEnd:', error);
    }
  };

  useEffect(() => {
    const allIds = [
      ...stageFrames.map(s => s.id),
      ...shapes.map(s => s.id),
      ...reactShapes.map(r => r.id),
      ...images.map(i => i.id),
      ...connections.map(c => c.id)
    ];
    const map: { [key: string]: React.RefObject<Konva.Node | null> } = { ...shapeRefs.current };
    
    allIds.forEach(id => {
      if (!map[id]) map[id] = React.createRef<Konva.Node | null>();
    });
      
    Object.keys(map).forEach(k => {
      if (!allIds.includes(k)) delete map[k];
    });
    shapeRefs.current = map;
  }, [stageFrames, shapes, reactShapes, images, connections]);

  // ========== FIXED: TRANSFORMER SYNC ==========
  useEffect(() => {
    if (!trRef.current || selectedNodeIds.length === 0) {
      trRef.current?.nodes([]);
      return;
    }

    const nodes = selectedNodeIds
      .map(id => shapeRefs.current[id]?.current)
      .filter((n): n is Konva.Node => !!n && n.getClassName() !== 'Path'); // exclude connections

    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedNodeIds, trRef]);

  const allShapesToRender = React.useMemo(() => {
    console.log('🔄 StageComponent re-rendering with shapes:', {
      stageFrames: stageFrames.length,
      konvaShapes: shapes.length,
      reactShapes: reactShapes.length,
      images: images.length,
      connections: connections.length,
      total: stageFrames.length + shapes.length + reactShapes.length + images.length + connections.length
    });
    
    return [
      ...stageFrames.map(s => ({ ...s, __kind: 'stage' as const })),
      ...shapes.map(s => ({ ...s, __kind: 'konva' as const })),
      ...images.map(s => ({ ...s, __kind: 'image' as const })),
      ...connections.map(s => ({ ...s, __kind: 'connection' as const })),
      ...reactShapes.map(s => ({ ...s, __kind: 'react' as const })),
    ];
  }, [stageFrames, shapes, reactShapes, images, connections]);

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
      setSelectedNodeIds([]);
      return;
    }
    
    if (e.target.hasName('selectable-shape')) {
      const clickedId = e.target.id();
      console.log('✅ Clicked on selectable shape:', clickedId);
      
      const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      
      if (isMultiSelect) {
        if (selectedNodeIds.includes(clickedId)) {
          setSelectedNodeIds((prev: string[]) => prev.filter((id: string) => id !== clickedId));
        } else {
          setSelectedNodeIds((prev: string[]) => [...prev, clickedId]);
        }
      } else {
        setSelectedNodeIds([clickedId]);
      }
    } else {
      console.log('❌ Not a selectable shape:', e.target.name());
    }
  };

  const handleShapeClick = (item: CombinedShape, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      const clickedId = item.id;
      console.log('✅ Shape clicked:', clickedId);
      
      const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      
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

  const handleConnectionClick = (connection: Connection, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (activeTool === "select") {
      console.log('🔗 Connection clicked:', connection.id);
      const clickedId = connection.id;
      
      const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      
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
      setImages((prev: ImageShape[]) => prev.map((img: ImageShape) =>
        img.id === imageShape.id
          ? { ...img, x: node.x(), y: node.y() }
          : img
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
        <GridLayer stage={stageInstance} baseSize={30} color="#d6d4d4ff" />
        <Layer name="draw-layer">
          {allShapesToRender.map((item) => {
            console.log(`🎯 Rendering shape: ${item.id} (${item.__kind}:${item.type})`);
            
            const commonProps: {
              id: string;
              draggable: boolean;
              name: string;
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
              onTap: (e: Konva.KonvaEventObject<MouseEvent>) => void;
              x?: number;
              y?: number;
            } = {
              id: item.id,
              draggable: (item.draggable ?? true) && activeTool === "select",
              name: 'selectable-shape',
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleShapeClick(item, e),
              onTap: (e: Konva.KonvaEventObject<MouseEvent>) => handleShapeClick(item, e),
            };

            // Add position and drag handlers only for shapes that support them
            if (item.__kind !== 'connection') {
              const positionedItem = item as CombinedShape & { x: number; y: number };
              commonProps.x = positionedItem.x;
              commonProps.y = positionedItem.y;
            }

            if (item.__kind === 'stage') {
              const stageItem = item as KonvaShape;
              return (
                <Rect
                  key={item.id}
                  ref={shapeRefs.current[item.id] as React.RefObject<Konva.Rect>}
                  {...commonProps}
                  {...commonDragProps}
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
                  ref={shapeRefs.current[item.id] as React.RefObject<Konva.Image>}
                  imageShape={imageItem}
                  onDragStart={commonDragProps.onDragStart}
                  onDragMove={commonDragProps.onDragMove}
                  onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                    commonDragProps.onDragEnd?.(e);
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
                  ref={shapeRefs.current[item.id] as React.RefObject<Konva.Path>}
                  connection={connectionItem}
                  onDragEnd={commonDragProps.onDragEnd}
                  onClick={(e: Konva.KonvaEventObject<MouseEvent>) => handleConnectionClick(connectionItem, e)}
                  updateConnection={updateConnection}
                  onDelete={onDelete}
                />
              );
            } else if (item.__kind === 'konva') {
              const konvaItem = item as KonvaShape;
              switch (item.type) {
                case 'rect':
                  return (
                    <Rect
                      key={item.id}
                      ref={shapeRefs.current[item.id] as React.RefObject<Konva.Rect>}
                      {...commonProps}
                      {...commonDragProps}
                      width={konvaItem.width ?? 100}
                      height={konvaItem.height ?? 100}
                      fill={konvaItem.fill}
                      cornerRadius={konvaItem.cornerRadius ?? 0}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                    />
                  );
                case 'circle':
                  return (
                    <Circle
                      key={item.id}
                      ref={shapeRefs.current[item.id] as React.RefObject<Konva.Circle>}
                      {...commonProps}
                      {...commonDragProps}
                      radius={konvaItem.radius ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                    />
                  );
                case 'ellipse':
                  return (
                    <Ellipse
                      key={item.id}
                      ref={shapeRefs.current[item.id] as React.RefObject<Konva.Ellipse>}
                      {...commonProps}
                      {...commonDragProps}
                      radiusX={konvaItem.radiusX ?? 80}
                      radiusY={konvaItem.radiusY ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                    />
                  );
                case 'triangle':
                  return (
                    <RegularPolygon
                      key={item.id}
                      ref={shapeRefs.current[item.id] as React.RefObject<Konva.RegularPolygon>}
                      {...commonProps}
                      {...commonDragProps}
                      sides={3}
                      radius={konvaItem.radius ?? 50}
                      fill={konvaItem.fill}
                      stroke={konvaItem.stroke}
                      strokeWidth={konvaItem.strokeWidth ?? 0}
                      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                    />
                  );
                case 'arrow':
                  return (
                    <Arrow
                      key={item.id}
                      ref={shapeRefs.current[item.id] as React.RefObject<Konva.Arrow>}
                      {...commonProps}
                      {...commonDragProps}
                      points={(konvaItem.points as number[]) ?? [0, 0, 100, 0]}
                      stroke={konvaItem.fill ?? konvaItem.stroke}
                      fill={konvaItem.fill}
                      strokeWidth={konvaItem.strokeWidth ?? 2}
                      pointerLength={(konvaItem as KonvaShape & { pointerLength?: number }).pointerLength ?? 10}
                      pointerWidth={(konvaItem as KonvaShape & { pointerWidth?: number }).pointerWidth ?? 10}
                      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                    />
                  );
                default:
                  return null;
              }
            } else if (item.__kind === 'react') {
              if (item.type === 'text') {
                const textItem = item as ReactShape;
                const isEditing = selectedNodeIds.includes(item.id) && activeTool === "text";
                
                return (
                  <TextComponent
                    key={item.id}
                    ref={shapeRefs.current[item.id] as React.RefObject<Konva.Text>}
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    text={textItem.text ?? "Type something..."}
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
                    isEditing={isEditing}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeIds([item.id]);
                      }
                    }}
                    onUpdate={(newAttrs: Partial<ReactShape>) => {
                      setReactShapes(prev => prev.map(shape =>
                        shape.id === item.id ? { ...shape, ...newAttrs } : shape
                      ));
                    }}
                    onStartEditing={() => {
                      setActiveTool("text");
                    }}
                    onFinishEditing={() => {
                      setActiveTool("select");
                    }}
                    onDragStart={commonDragProps.onDragStart}
                    onDragMove={commonDragProps.onDragMove}
                    onDragEnd={commonDragProps.onDragEnd}
                    onTransformEnd={(e: Konva.KonvaEventObject<Event>) => handleShapeTransformEnd(item, e)}
                  />
                );
              } else if (item.type === 'stickyNote') {
                return (
                  <EditableStickyNoteComponent
                    key={item.id}
                    ref={shapeRefs.current[item.id] as React.RefObject<Konva.Group>}
                    shapeData={item as ReactShape}
                    isSelected={selectedNodeIds.includes(item.id)}
                    activeTool={activeTool}
                    onSelect={() => {
                      if (activeTool === "select") {
                        setSelectedNodeIds([item.id]);
                      }
                    }}
                    onUpdate={(newAttrs: Partial<ReactShape>) => {
                      setReactShapes(prev => prev.map(shape =>
                        shape.id === item.id ? { ...shape, ...newAttrs } : shape
                      ));
                    }}
                    onDragStart={commonDragProps.onDragStart}
                    onDragMove={commonDragProps.onDragMove}
                    onDragEnd={commonDragProps.onDragEnd}
                   
                  />
                );
              } else {
                return null;
              }
            } else {
              return null;
            }
          })}
          
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
          <Transformer
            ref={trRef}
            enabledAnchors={[
              "top-left", "top-right",
              "bottom-left", "bottom-right","top-center", "bottom-center",
              "middle-left", "middle-right"
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (selectedNodeIds.length > 1) {
                return newBox;
              }
              
              const selectedShapes = allShapesToRender.filter(item => selectedNodeIds.includes(item.id));
              const selectedImage = selectedShapes.find(item => item.__kind === 'image');
              
              if (selectedImage) {
                const imageShape = selectedImage as ImageShape;
                const aspectRatio = imageShape.width / imageShape.height;
                
                let width = newBox.width;
                let height = newBox.height;
                
                if (Math.abs(width - oldBox.width) > Math.abs(height - oldBox.height)) {
                  height = width / aspectRatio;
                } else {  
                  width = height * aspectRatio;
                }
                
                return {
                  ...newBox,
                  width: Math.max(20, width),
                  height: Math.max(20, height),
                };
              }
              
              return {
                ...newBox,
                width: Math.max(5, newBox.width),
                height: Math.max(5, newBox.height),
              };
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