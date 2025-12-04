  // components/StageComponent.tsx
  import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
  import dynamic from "next/dynamic";
  import Konva from "konva";
  import { Layer, Transformer, Line, Rect, Circle, Ellipse, Arrow, Image, Group, Text, Path } from "react-konva";
  import GridLayer from "@/components/gridLayer"; 
  import { ReactShape, Tool, ImageShape, Action } from "../types/board-types";
  import TextComponent from "./TextComponent";
  import { KonvaShape } from "@/hooks/useShapes";
  import { Connection, Side } from "@/hooks/useBoardState";
  import { getOrthogonalPath, getAnchorPoint, Rect as UtilsRect } from "@/lib/connection-utils";
  import EditableStickyNoteComponent from "./EditableStickyNoteComponent";

  const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false });

  // ... [Keep existing Interfaces & Constants unmodified] ...
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
    hasLoaded?: boolean;
    handleStartTextEditing?: (textProps: any) => void;
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
    hoveredNodeId: string | null;
    setHoveredNodeId: (id: string | null) => void;
    handleAnchorMouseDown: (e: any, nodeId: string, side: Side, pos: { x: number, y: number }) => void;
    handleAnchorClick: (e: any, nodeId: string, side: Side) => void;
    handleShapeMouseEnter: (id: string) => void;
    tempConnection: Connection | null;
    isSpacePressed?: boolean;
    duplicateShape: (direction: 'top' | 'right' | 'bottom' | 'left', shouldConnect?: boolean) => void;
    onAction?: (action: Action) => void;
  }

  const LOCK_ICON_PATH = "M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z";
  const UNLOCK_ICON_PATH = "M7 11V7a5 5 0 0 1 10 0v4"; 

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

  // ... [Keep StageFrameNode, OrthogonalConnection, AnchorOverlay, ImageElement unchanged] ...
  const StageFrameNode = React.memo(({ item, commonProps, setShapeRef, updateShape, onAction }: any) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const groupRef = useRef<Konva.Group>(null);
    const textRef = useRef<Konva.Text>(null);

    const handleRef = (node: Konva.Node | null) => {
      setShapeRef(item.id, node);
      // @ts-ignore
      groupRef.current = node;
    };

    const handleToggleLock = (e: Konva.KonvaEventObject<any>) => {
      e.cancelBubble = true;
      const newLockedState = !item.isLocked;
      updateShape(item.id, { isLocked: newLockedState });
      if (onAction) {
        onAction({
          type: 'update-stage-frame',
          id: item.id,
          prevData: { ...item },
          newData: { ...item, isLocked: newLockedState }
        });
      }
    };

    const startEditing = () => {
      if (item.isLocked) return;
      setIsEditingName(true);
    };

    useEffect(() => {
      if (isEditingName && textRef.current && groupRef.current) {
        const textNode = textRef.current;
        const stage = textNode.getStage();
        if (!stage) return;

        textNode.hide();
        const textPos = textNode.getAbsolutePosition();
        const areaPosition = {
          x: stage.container().getBoundingClientRect().left + textPos.x,
          y: stage.container().getBoundingClientRect().top + textPos.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.value = item.name || "Section";
        textarea.style.position = 'fixed';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${Math.max(100, textNode.width() + 20)}px`;
        textarea.style.height = '30px';
        textarea.style.fontSize = '14px';
        textarea.style.border = 'none';
        textarea.style.padding = '4px';
        textarea.style.margin = '0px';
        textarea.style.background = '#f1f5f9'; 
        textarea.style.borderRadius = '4px';
        textarea.style.outline = '2px solid #3b82f6';
        textarea.style.color = '#333';
        textarea.style.fontFamily = 'Inter, sans-serif';
        textarea.style.zIndex = '10000';
        textarea.focus();
        textarea.select();

        const finishEditing = () => {
          const newName = textarea.value;
          setIsEditingName(false);
          textNode.show();
          if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
          if (newName !== item.name) {
            updateShape(item.id, { name: newName });
            if (onAction) {
              onAction({
                type: 'update-stage-frame',
                id: item.id,
                prevData: { ...item },
                newData: { ...item, name: newName }
              });
            }
          }
        };

        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === 'Escape') finishEditing();
        };

        textarea.addEventListener('keydown', onKeyDown);
        textarea.addEventListener('blur', finishEditing);

        return () => {
          textarea.removeEventListener('keydown', onKeyDown);
          textarea.removeEventListener('blur', finishEditing);
          if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
        };
      } else if (textRef.current) {
          textRef.current.show();
      }
    }, [isEditingName, item.name, item.id, updateShape, onAction]);

    const frameName = item.name || "Section";
    const pillWidth = Math.max(80, frameName.length * 9) + 30; 
    
    return (
      <Group
        ref={handleRef}
        x={item.x}
        y={item.y}
        {...commonProps}
        onClick={(e) => commonProps.onClick(e, item.id)}
        onTap={(e) => commonProps.onTap(e, item.id)}
        draggable={!item.isLocked && commonProps.draggable}
      >
        <Group 
          y={-32} 
          onDblClick={(e) => { e.cancelBubble=true; startEditing(); }}
          onDblTap={(e) => { e.cancelBubble=true; startEditing(); }}
          onMouseEnter={(e) => { if(item.isLocked) return; e.target.getStage()!.container().style.cursor = "text"; }}
          onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; }}
        >
          <Rect width={pillWidth} height={26} fill={item.isLocked ? "#fee2e2" : "#f1f5f9"} cornerRadius={[6, 6, 0, 0]} stroke={item.isLocked ? "#ef4444" : "#cbd5e1"} strokeWidth={1} />
          <Text ref={textRef} x={10} y={7} text={frameName} fontSize={12} fontFamily="Inter, sans-serif" fill="#334155" fontStyle="bold" listening={false} />
          <Group x={pillWidth - 24} y={5} onClick={handleToggleLock} onTap={handleToggleLock} onMouseEnter={(e) => e.target.getStage()!.container().style.cursor = "pointer"} onMouseLeave={(e) => e.target.getStage()!.container().style.cursor = "default"}>
              <Circle radius={10} x={8} y={8} fill="transparent" />
              <Path data={item.isLocked ? LOCK_ICON_PATH : UNLOCK_ICON_PATH} fill={item.isLocked ? "#ef4444" : "#94a3b8"} scaleX={0.7} scaleY={0.7} x={4} y={2} />
          </Group>
        </Group>
        <Rect width={item.width} height={item.height} fill={item.fill || "#ffffff"} stroke={item.isLocked ? "#ef4444" : (item.stroke || "#e2e8f0")} strokeWidth={item.isLocked ? 3 : (item.strokeWidth || 2)} cornerRadius={item.cornerRadius || 0} shadowBlur={item.isLocked ? 0 : 5} shadowColor="rgba(0,0,0,0.05)" shadowOffsetY={4} />
      </Group>
    );
  });
  StageFrameNode.displayName = "StageFrameNode";

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
    const pathData = getOrthogonalPath(startPoint, endPoint, connection.from.side, endSide, 40, 20); 
    const strokeColor = selected ? "#3366FF" : (connection.stroke || "#64748B");
    const strokeWidth = selected ? 4 : (connection.strokeWidth || 4);
    const arrowLength = 10;
    let arrowX = endPoint.x; let arrowY = endPoint.y; let arrowRotation = 0;
    switch (endSide) { case "top": arrowY -= arrowLength; arrowRotation = 90; break; case "right": arrowX += arrowLength; arrowRotation = 180; break; case "bottom": arrowY += arrowLength; arrowRotation = 270; break; case "left": arrowX -= arrowLength; arrowRotation = 0; break; }
    return (
      <Group onClick={onClick} onTap={(e) => onClick(e)}>
        <Path data={pathData} stroke="transparent" strokeWidth={30} />
        <Path data={pathData} stroke={strokeColor} strokeWidth={strokeWidth} lineCap="round" lineJoin="round" dash={connection.id === 'temp-connection' ? [5, 5] : undefined} listening={false} />
        <Arrow x={arrowX} y={arrowY} points={[0, 0, arrowLength, 0]} rotation={arrowRotation} stroke={strokeColor} fill={strokeColor} strokeWidth={strokeWidth} pointerLength={arrowLength} pointerWidth={arrowLength} lineCap="round" lineJoin="round" listening={false} />
      </Group>
    );
  });
  OrthogonalConnection.displayName = "OrthogonalConnection";

  const AnchorOverlay = React.memo(({ shape, onMouseDown, onClick, scale }: any) => {
    if (!shape) return null;
    const rect = getNormalizedRect(shape);
    const sides: Side[] = ["top", "right", "bottom", "left"];
    const OFFSET = 15 / scale; const HIT_RADIUS = 40 / scale; const VISIBLE_RADIUS = 9 / scale; const STROKE_WIDTH = 3 / scale;
    return (
      <Group>
        {sides.map(side => {
          const pos = getAnchorPoint(rect, side);
          let displayX = pos.x; let displayY = pos.y;
          if (side === 'top') displayY -= OFFSET; if (side === 'bottom') displayY += OFFSET; if (side === 'left') displayX -= OFFSET; if (side === 'right') displayX += OFFSET;
          return (
            <Group key={side} x={displayX} y={displayY} onMouseDown={(e) => { e.cancelBubble = true; onMouseDown(e, side, pos); }} onClick={(e) => onClick(e, side)} onTap={(e) => onClick(e, side)} onMouseEnter={(e) => { const stage = e.target.getStage(); if(stage) stage.container().style.cursor = "crosshair"; }} onMouseLeave={(e) => { const stage = e.target.getStage(); if(stage) stage.container().style.cursor = "default"; }}>
              <Circle radius={HIT_RADIUS} fill="transparent" />
              <Circle radius={VISIBLE_RADIUS} fill="#ffffff" stroke="#3366FF" strokeWidth={STROKE_WIDTH} shadowBlur={4} shadowColor="rgba(0,0,0,0.15)" listening={false} />
            </Group>
          );
        })}
      </Group>
    );
  });
  AnchorOverlay.displayName = "AnchorOverlay";

  const ImageElement = React.memo(React.forwardRef<Konva.Image, any>(({ imageShape, ...props }, ref) => {
    const [image, setImage] = React.useState<HTMLImageElement | null>(null);
    useEffect(() => { if (!imageShape.src) return; const img = new window.Image(); img.crossOrigin = "anonymous"; img.src = imageShape.src; img.onload = () => setImage(img); }, [imageShape.src]);
    if (!image) return <Rect x={imageShape.x} y={imageShape.y} width={imageShape.width} height={imageShape.height} fill="#f0f0f0" />;
    return <Image ref={ref} image={image} x={imageShape.x} y={imageShape.y} width={imageShape.width} height={imageShape.height} rotation={imageShape.rotation} draggable={imageShape.draggable} name="selectable-shape" id={imageShape.id} {...props} />;
  }));
  ImageElement.displayName = 'ImageElement';

  // ... [Keep ShapeRenderer exactly as it was in the previous fix] ...
  const ShapeRenderer = React.memo(({ item, isSelected, isEditing, setEditingId, updateShape, setShapeRef, onAction, draggable, onShapeClick, onShapeTap, onDragStart, onDragMove, onDragEnd, onTransformStart, onTransform, onTransformEnd, onMouseEnter, onMouseLeave }: any) => {
    
    const handleRef = (node: Konva.Node | null) => setShapeRef(item.id, node);

    const dispatchUpdateAction = (id: string, newAttrs: any) => {
        if (!onAction) return; 
        let type: Action['type'] = 'update-konva-shape';
        if(item.type === 'text' || item.type === 'stickyNote') type = 'update-react-shape';
        else if(item.type === 'image') type = 'update-image';
        else if(item.type === 'stage') type = 'update-stage-frame';
        else type = 'update-konva-shape';
        onAction({ type, id, prevData: item, newData: { ...item, ...newAttrs } } as any);
    };

    const commonProps = {
        id: item.id,
        draggable: !item.isLocked && draggable,
        name: 'selectable-shape',
        onClick: (e: any) => { if(onShapeClick) onShapeClick(e, item.id); },
        onTap: (e: any) => { if(onShapeTap) onShapeTap(e, item.id); },
        onMouseDown: (e: any) => { e.cancelBubble = true; },
        onDragStart,
        onDragMove,
        onDragEnd,
        onTransformStart,
        onTransform,
        onTransformEnd,
        onMouseEnter,
        onMouseLeave
    };

    if (item.__kind === 'stage') {
      return <StageFrameNode item={item} commonProps={commonProps} setShapeRef={setShapeRef} updateShape={updateShape} onAction={onAction} />;
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
        return ( 
          <Group {...commonProps} x={item.x} y={item.y} ref={handleRef}>
              <TextComponent 
                  {...item} 
                  x={0} y={0} 
                  draggable={false} 
                  isSelected={isSelected} 
                  isEditing={isEditing} 
                  onStartEditing={() => setEditingId(item.id)} 
                  onFinishEditing={() => setEditingId(null)} 
                  onUpdate={(attrs: any) => { dispatchUpdateAction(item.id, attrs); updateShape(item.id, attrs); }} 
              />
          </Group>
        );
      }
      if (item.type === 'stickyNote') {
        return ( <EditableStickyNoteComponent ref={handleRef} shapeData={item} isSelected={isSelected} activeTool={null} onSelect={() => {}} onUpdate={(attrs: any) => { dispatchUpdateAction(item.id, attrs); updateShape(item.id, attrs); }} {...commonProps} /> );
      }
    }
    return null;
  }); 
  ShapeRenderer.displayName = "ShapeRenderer";

  // --- FIXED: QUICK ACTIONS OVERLAY ---
  // This version is safer and smarter about positioning
  // --- FIXED: QUICK ACTIONS OVERLAY ---
  const QuickActionsOverlay = React.memo(({ selectedNodeId, allShapesMap, onDuplicate, scale }: any) => {
    const shape = allShapesMap.get(selectedNodeId);
    const [box, setBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
      if (!shape) return;
      
      const timer = setTimeout(() => {
          const node = Konva.stages[0]?.findOne('#' + selectedNodeId);
          if (node) {
            const rect = node.getClientRect({ skipTransform: true }); 
            const w = Math.max(50, rect.width * node.scaleX());
            const h = Math.max(30, rect.height * node.scaleY());
            setBox({ x: shape.x, y: shape.y, width: w, height: h });
          } else {
              setBox(getNormalizedRect(shape));
          }
      }, 10);
      return () => clearTimeout(timer);
    }, [selectedNodeId, shape, allShapesMap]); 

    if (!shape || shape.isLocked) return null; 

    const { x, y, width, height } = box;
    
    // CONSTANTS (Fixed missing VISIBLE_RADIUS)
    const GAP = 50 / scale; 
    const BUTTON_SIZE = 28 / scale; 
    const VISIBLE_RADIUS = 12 / scale; // <--- ADDED BACK
    const HALF_BTN = BUTTON_SIZE / 2; 
    const ICON_SIZE = 5 / scale; 
    const STROKE_WIDTH = 2 / scale;
    
    const actions = [ 
        { dir: 'top', x: x + width / 2, y: y - GAP }, 
        { dir: 'right', x: x + width + GAP, y: y + height / 2 }, 
        { dir: 'bottom', x: x + width / 2, y: y + height + GAP }, 
        { dir: 'left', x: x - GAP, y: y + height / 2 }, 
    ];

    return (
      <Group>
        {actions.map((action) => (
          <Group key={action.dir} x={action.x} y={action.dir === 'top' || action.dir === 'bottom' ? action.y - HALF_BTN : action.y - HALF_BTN}>
            <Circle radius={BUTTON_SIZE} fill="transparent" onClick={(e) => { e.cancelBubble = true; onDuplicate(action.dir,true); }} onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = "pointer"; const group = e.target.getParent() as Konva.Group; group?.findOne('.visible-btn')?.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 }); group?.findOne('.plus-icon')?.to({ scaleX: 1.2, scaleY: 1.2, duration: 0.1 }); }} onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = "default"; const group = e.target.getParent() as Konva.Group; group?.findOne('.visible-btn')?.to({ scaleX: 1, scaleY: 1, duration: 0.1 }); group?.findOne('.plus-icon')?.to({ scaleX: 1, scaleY: 1, duration: 0.1 }); }} />
            <Circle name="visible-btn" radius={VISIBLE_RADIUS} fill="#3366FF" opacity={1} listening={false} />
            <Group name="plus-icon" listening={false}><Line points={[-ICON_SIZE, 0, ICON_SIZE, 0]} stroke="white" strokeWidth={STROKE_WIDTH} listening={false} /><Line points={[0, -ICON_SIZE, 0, ICON_SIZE]} stroke="white" strokeWidth={STROKE_WIDTH} listening={false} /></Group>
          </Group>
        ))}
      </Group>
    );
  });
  QuickActionsOverlay.displayName = "QuickActionsOverlay";

  const StageComponent: React.FC<StageComponentProps> = ({
    stageRef, trRef, scale, position, activeTool, lines, hasLoaded,
    reactShapes, shapes, stageFrames, images, connections,
    selectedNodeIds, stageInstance, width, height,duplicateShape,
    handleWheel, handleMouseDown, handleMouseUp, handleMouseMove,
    handleTouchStart, handleTouchEnd, handleTouchMove,
    setSelectedNodeIds, setReactShapes, setShapes, setImages,
    setStageFrames, updateShape, setStageInstance,
    editingId, setEditingId, onTextCreate,
    hoveredNodeId, setHoveredNodeId, handleAnchorMouseDown, handleAnchorClick, tempConnection, isSpacePressed = false,
    onAction 
  }) => {
    const shapeRefs = useRef<{ [key: string]: Konva.Node | null }>({});
    const dragStartPos = useRef<Map<string, { x: number; y: number }>>(new Map());
    const transformStartAttrs = useRef<{ [key: string]: any }>({});

    const setShapeRef = useCallback((id: string, node: Konva.Node | null) => {
      if (node) shapeRefs.current[id] = node;
      else delete shapeRefs.current[id];
    }, []);

    const allShapesMap = useMemo(() => {
      const map = new Map();
      [...shapes, ...reactShapes, ...images, ...stageFrames].forEach(s => map.set(s.id, s));
      return map;
    }, [shapes, reactShapes, images, stageFrames]);

    // ... [Handlers: click, tap, mouseEnter, mouseLeave, dragStart, dragMove, dragEnd - UNCHANGED] ...
    const handleShapeClick = useCallback((e: any, id: string) => { 
      e.cancelBubble=true; 
      setSelectedNodeIds([id]); 
      setEditingId(null);
    }, [setSelectedNodeIds, setEditingId]);

    const handleShapeTap = useCallback((e: any, id: string) => { 
      e.cancelBubble=true; 
      setSelectedNodeIds([id]); 
      setEditingId(null);
    }, [setSelectedNodeIds, setEditingId]);

    const handleMouseEnter = useMemo(() => {
      if (activeTool !== 'connect') return undefined;
      return (e: any) => setHoveredNodeId(e.target.id());
    }, [activeTool, setHoveredNodeId]);

    const handleMouseLeave = useMemo(() => {
      if (activeTool !== 'connect') return undefined;
      return () => setHoveredNodeId(null);
    }, [activeTool, setHoveredNodeId]);

    const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      if (!node) return;
      const shape = allShapesMap.get(node.id());
      if (shape?.isLocked) { e.cancelBubble = true; node.stopDrag(); return; }
      if (!selectedNodeIds.includes(node.id())) { setSelectedNodeIds([node.id()]); }
      const startPositions = new Map<string, {x:number, y:number}>();
      selectedNodeIds.forEach(id => { const ref = shapeRefs.current[id]; if (ref) startPositions.set(id, { x: ref.x(), y: ref.y() }); });
      if (!startPositions.has(node.id())) { startPositions.set(node.id(), { x: node.x(), y: node.y() }); }
      dragStartPos.current = startPositions;
    }, [selectedNodeIds, setSelectedNodeIds, allShapesMap]);

    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const startPos = dragStartPos.current.get(node.id());
      if (!startPos) return;
      const dx = node.x() - startPos.x;
      const dy = node.y() - startPos.y;
      selectedNodeIds.forEach(id => {
        if (id === node.id()) return;
        const shape = allShapesMap.get(id);
        if (shape?.isLocked) return;
        const otherNode = shapeRefs.current[id];
        const otherStart = dragStartPos.current.get(id);
        if (otherNode && otherStart) { otherNode.x(otherStart.x + dx); otherNode.y(otherStart.y + dy); }
      });
    if (trRef.current) trRef.current.getLayer()?.batchDraw();
    }, [selectedNodeIds, allShapesMap]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const startPos = dragStartPos.current.get(node.id());
      if(!startPos) return;
      const dx = node.x() - startPos.x;
      const dy = node.y() - startPos.y;
      const applyMove = (list: any[], setter: any) => {
          const affected = list.filter(item => selectedNodeIds.includes(item.id) || item.id === node.id());
          if (affected.length === 0) return;
          setter((prev: any[]) => prev.map(item => {
              if (selectedNodeIds.includes(item.id) || item.id === node.id()) {
                  if (item.isLocked) return item;
                  const myStart = dragStartPos.current.get(item.id);
                  if (myStart) { return { ...item, x: myStart.x + dx, y: myStart.y + dy }; }
              }
              return item;
          }));
      };
      applyMove(reactShapes, setReactShapes);
      applyMove(shapes, setShapes);
      applyMove(images, setImages);
      applyMove(stageFrames, setStageFrames);
      if (onAction) {
          const actionsToDispatch: Action[] = [];
          const affectedIds = new Set([...selectedNodeIds, node.id()]);
          affectedIds.forEach(id => {
              const shape = allShapesMap.get(id);
              if (shape?.isLocked) return;
              const myStart = dragStartPos.current.get(id);
              const myNode = shapeRefs.current[id]; 
              if (shape && myStart && myNode) {
                  let type: Action['type'] = 'update-konva-shape';
                  if(shape.type === 'text' || shape.type === 'stickyNote') type = 'update-react-shape';
                  else if(shape.type === 'image') type = 'update-image';
                  else if(shape.type === 'stage') type = 'update-stage-frame';
                  else type = 'update-konva-shape';
                  const prevData = { ...shape, x: myStart.x, y: myStart.y };
                  const newData = { ...shape, x: myNode.x(), y: myNode.y() };
                  actionsToDispatch.push({ type, id: shape.id, prevData, newData } as any);
              }
          });
          if (actionsToDispatch.length === 1) onAction(actionsToDispatch[0]);
          else if (actionsToDispatch.length > 1) onAction({ type: 'batch', actions: actionsToDispatch });
      }
      dragStartPos.current.clear();
    }, [selectedNodeIds, reactShapes, shapes, images, stageFrames, setReactShapes, setShapes, setImages, setStageFrames, allShapesMap, onAction]);

    const handleShapeTransformStart = useCallback((e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        const id = node.id();
        const shape = allShapesMap.get(id);
        if (shape) transformStartAttrs.current[id] = { ...shape };
    }, [allShapesMap]);

    // --- FIGMA-STYLE TRANSFORM: The Logic Core ---
  const handleShapeTransform = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target; // The Group
    const id = node.id();
    const item = allShapesMap.get(id);
    
    if (!item || item.type !== 'text') return;

    const group = node as Konva.Group;
    const textNode = group.findOne('Text') as Konva.Text;
    const transformer = trRef.current;
    const anchor = transformer?.getActiveAnchor();

    if (!anchor || !textNode) return;

    // 1. SIDE HANDLES: Reflow (Width Only)
    if (['middle-left', 'middle-right'].includes(anchor)) {
        const scaleX = group.scaleX();
        
        // FIX: Get width from the TEXT node, not the Group.
        // The Group's width property is often 0 or desynced from the text content.
        const currentWidth = textNode.width();
        
        // Calculate new actual width
        const newWidth = Math.max(30, currentWidth * scaleX);
        
        // Apply new width directly to the text
        textNode.width(newWidth);
        
        // Update the group width to match (optional but good practice)
        group.width(newWidth);
        
        // FORCE RESET SCALE
        // This keeps the font-size constant while the width changes (Reflow)
        group.scaleX(1);
        group.scaleY(1);
    }
    // 2. CORNER HANDLES: Uniform Scale (Standard Konva behavior)
    // We let Konva scale the Group visually. 
    // We will 'bake' that scale into fontSize in handleShapeTransformEnd.
  }, [allShapesMap]);

    const handleShapeTransformEnd = useCallback((item: any, e: any) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Always bake scale into properties at end
      node.scaleX(1); 
      node.scaleY(1);
      
      const updates: any = { 
          x: node.x(), 
          y: node.y(), 
          rotation: node.rotation() 
      };

      if (item.type === 'text') {
        // If scale is roughly 1, it was a Side Drag (Reflow), so just save width.
        // If scale is NOT 1, it was a Corner Drag, so update Font Size + Width.
        if (Math.abs(scaleX - 1) > 0.05 || Math.abs(scaleY - 1) > 0.05) {
            const currentFontSize = item.fontSize || 24;
            const currentWidth = item.width || 200;
            updates.fontSize = Math.max(12, currentFontSize * scaleY);
            updates.width = Math.max(30, currentWidth * scaleX);
        } else {
            updates.width = node.width();
        }
        updates.height = undefined; // Auto-height
      }
      else if (item.type === 'circle') {
        updates.radius = Math.max(5, (node as Konva.Circle).radius() * scaleX);
      } 
      else if (item.type === 'ellipse') {
        updates.radiusX = Math.max(5, (node as Konva.Ellipse).radiusX() * scaleX);
        updates.radiusY = Math.max(5, (node as Konva.Ellipse).radiusY() * scaleY);
      } 
      else {
        const baseWidth = node.width() || item.width;
        const baseHeight = node.height() || item.height;
        updates.width = Math.max(5, baseWidth * scaleX);
        updates.height = Math.max(5, baseHeight * scaleY);
      }
      
      updateShape(item.id, updates);
      if (onAction) {
          const prevData = transformStartAttrs.current[item.id];
          if (prevData) {
              let type: Action['type'] = 'update-konva-shape';
              if(item.type === 'text' || item.type === 'stickyNote') type = 'update-react-shape';
              else if(item.type === 'image') type = 'update-image';
              else if(item.type === 'stage') type = 'update-stage-frame';
              else type = 'update-konva-shape';
              
              onAction({ type, id: item.id, prevData, newData: { ...prevData, ...updates } } as any);
              delete transformStartAttrs.current[item.id];
          }
      }
    }, [updateShape, onAction]);

    useEffect(() => {
      if (!trRef.current) return;
      if (selectedNodeIds.length === 0) { trRef.current.nodes([]); return; }
      const nodes = selectedNodeIds.map(id => { const shape = allShapesMap.get(id); if (shape?.isLocked) return null; return shapeRefs.current[id]; }).filter((n): n is Konva.Node => !!n);
      trRef.current.nodes(nodes);
      trRef.current.getLayer()?.batchDraw();
    }, [selectedNodeIds, shapes, reactShapes, images, stageFrames, allShapesMap]); 

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
          if (activeTool === 'text') { const pos = e.target.getStage()?.getRelativePointerPosition(); if(pos) onTextCreate(pos); }
      }
    };

    const isDraggable = (activeTool === 'select' || activeTool === null) && !isSpacePressed;

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
                  onAction={onAction} 
                  draggable={isDraggable}
                  onShapeClick={handleShapeClick}
                  onShapeTap={handleShapeTap}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTransformStart={handleShapeTransformStart}
                  onTransform={handleShapeTransform} // Pass Real-time handler
                  onTransformEnd={(e: any) => handleShapeTransformEnd(item, e)}
                  onMouseEnter={item.type === 'text' || item.type === 'stickyNote' ? undefined : handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
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
              const shouldHideAnchors = selectedNode && ( selectedNode.type === 'stickyNote' || selectedNode.type === 'stage' || selectedNode.isLocked );
              const isText = selectedNode?.type === 'text';

              return (
                <Transformer 
                  ref={trRef}
                  resizeEnabled={!shouldHideAnchors}
                  rotateEnabled={!shouldHideAnchors}
                  
                  // ENABLE ALL ANCHORS (Corner for scale, Side for wrap)
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                  
                  // IMPORTANT: Disable keepRatio so side handles don't force height changes
                  keepRatio={!isText} 

                  boundBoxFunc={(oldBox, newBox) => {
                      // Prevent implosion or weird flipping
                      if (newBox.width < 30 || newBox.height < 5) return oldBox;
                      return newBox;
                  }}

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