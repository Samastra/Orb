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
  import { getOrthogonalPath, getAnchorPoint, Rect as UtilsRect } from "@/lib/connection-utils";
  import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

  const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false });

  type KonvaPointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>;

  // HELPER: Normalize any shape (Circle, Ellipse, etc) into a standard Bounding Box
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
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    onTextCreate: (pos: { x: number; y: number }) => void;
    handleStartTextEditing?: (textProps: any) => void;
    hoveredNodeId: string | null;
    setHoveredNodeId: (id: string | null) => void;
    handleAnchorMouseDown: (e: any, nodeId: string, side: Side, pos: {x: number, y: number}) => void;
    handleAnchorClick: (e: any, nodeId: string, side: Side) => void;
    handleShapeMouseEnter: (id: string) => void;
    tempConnection: Connection | null; 
    isSpacePressed?: boolean;
  }

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

    const pathData = getOrthogonalPath(startPoint, endPoint, connection.from.side, endSide);

    return (
      <Group onClick={onClick} onTap={onClick}>
        <Path data={pathData} stroke="transparent" strokeWidth={20} />
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

  const AnchorOverlay = React.memo(({ shape, onMouseDown, onClick }: any) => {
    if (!shape) return null;

    const rect = getNormalizedRect(shape);
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
              {/* Small hit area so it doesn't block underlying shapes */}
              <Circle radius={8} fill="transparent" />
              <Circle radius={5} fill="#ffffff" stroke="#007AFF" strokeWidth={2} shadowBlur={2} shadowColor="rgba(0,0,0,0.3)"/>
            </Group>
          );
        })}
      </Group>
    );
  });
  AnchorOverlay.displayName = "AnchorOverlay";

  const ImageElement = React.forwardRef<Konva.Image, any>(({ imageShape, onDragStart, onDragMove, onDragEnd, onTransformEnd }, ref) => {
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
    hoveredNodeId, setHoveredNodeId, handleAnchorMouseDown, handleAnchorClick, handleShapeMouseEnter, tempConnection, isSpacePressed = false
  }) => {
    const shapeRefs = useRef<{ [key: string]: Konva.Node | null }>({});
    const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());

    const setShapeRef = (id: string, node: Konva.Node | null) => {
      if (node) shapeRefs.current[id] = node;
      else delete shapeRefs.current[id];
    };

    useEffect(() => {
      if (!stageRef.current) return;
      requestAnimationFrame(() => { stageRef.current?.batchDraw(); });
    }, [shapes, reactShapes, images, stageFrames, stageRef]);

    const allShapesMap = useMemo(() => {
      const map = new Map();
      [...shapes, ...reactShapes, ...images, ...stageFrames].forEach(s => map.set(s.id, s));
      return map;
    }, [shapes, reactShapes, images, stageFrames]);

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
        const { x, y } = e.target.attrs;
        if (item.__kind === 'react') setReactShapes(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
        else if (item.__kind === 'konva') setShapes(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
        else if (item.__kind === 'image') setImages(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
        else if (item.__kind === 'stage') setStageFrames(prev => prev.map(s => s.id === item.id ? { ...s, x, y } : s));
    }, [setReactShapes, setShapes, setImages, setStageFrames]);

    const handleShapeTransformEnd = (item: any, e: any) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
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
    };

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

    // CLICK HANDLER: Prevents "Click Outside" from creating text if we are just editing
    const handleStageClick = (e: KonvaPointerEvent) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      
      if (clickedOnEmpty) {
          // If we were editing, just stop editing and RETURN. Do NOT create new text.
          if (editingId) {
              setEditingId(null);
              return;
          }

          setSelectedNodeIds([]);
          setEditingId(null);
          
          // Only create text if we are EXPLICITLY in text tool and NOT just finishing an edit
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
            {allShapesToRender.map((item: any) => {
              const commonProps = {
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
                  
                  onDragStart: (e: any) => {
                      if (!selectedNodeIds.includes(item.id)) {
                          setSelectedNodeIds([item.id]);
                      }
                      handleDragStart(e);
                  },
                  
                  onDragMove: handleDragMove,
                  onDragEnd: (e: any) => handleSingleDragEnd(item, e),
                  onTransformEnd: (e: any) => handleShapeTransformEnd(item, e),
                  
                  // EXCLUDE TEXT FROM ANCHOR LOGIC
                  onMouseEnter: (item.type === 'text' || item.type === 'stickyNote') 
                      ? undefined 
                      : () => setHoveredNodeId(item.id),
                  // ADD MOUSE LEAVE TO CLEAR ANCHORS
                  onMouseLeave: () => setHoveredNodeId(null),
              };

              if (item.__kind === 'stage') {
                  return <Rect key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} fill="#fff" stroke="#ccc" />;
              }
              if (item.__kind === 'image') {
                  return <ImageElement key={item.id} ref={node => setShapeRef(item.id, node)} imageShape={item} {...commonProps} />;
              }
              if (item.__kind === 'konva') {
                if (item.type === 'triangle') return <Line key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} points={item.points} fill={item.fill} closed={true} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
                if (item.type === 'arrow') return <Arrow key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} points={item.points} fill={item.fill} stroke={item.stroke || item.fill} strokeWidth={item.strokeWidth || 2} pointerLength={item.pointerLength || 10} pointerWidth={item.pointerWidth || 10} />;
                if (item.type === 'circle') return <Circle key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} x={item.x} y={item.y} radius={item.radius || 50} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
                if (item.type === 'ellipse') return <Ellipse key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} x={item.x} y={item.y} radiusX={item.radiusX || 80} radiusY={item.radiusY || 50} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} />;
                return <Rect key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} x={item.x} y={item.y} width={item.width} height={item.height} fill={item.fill} stroke={item.stroke} strokeWidth={item.strokeWidth} cornerRadius={item.cornerRadius} />;
              }
              if (item.__kind === 'react') {
                  if (item.type === 'text') {
                      return <TextComponent key={item.id} ref={node => setShapeRef(item.id, node)} {...commonProps} {...item} isSelected={selectedNodeIds.includes(item.id)} isEditing={editingId === item.id} onStartEditing={() => setEditingId(item.id)} onFinishEditing={() => setEditingId(null)} onUpdate={(attrs) => updateShape(item.id, attrs)} />;
                  }
                  if (item.type === 'stickyNote') {
                      return <EditableStickyNoteComponent key={item.id} ref={node => setShapeRef(item.id, node)} shapeData={item} isSelected={selectedNodeIds.includes(item.id)} activeTool={activeTool} onSelect={() => setSelectedNodeIds([item.id])} onUpdate={(attrs) => updateShape(item.id, attrs)} {...commonProps} />;
                  }
              }
              return null;
            })}

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

            {hoveredNodeId && (activeTool === "select" || activeTool === null) && allShapesMap.has(hoveredNodeId) && (
              <AnchorOverlay 
                  shape={allShapesMap.get(hoveredNodeId)}
                  onMouseDown={(e: any, side: Side, pos: any) => handleAnchorMouseDown(e, hoveredNodeId, side, pos)}
                  onClick={(e: any, side: Side) => handleAnchorClick(e, hoveredNodeId, side)}
              />
            )}
            
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