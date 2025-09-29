'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useCanvasState } from '@/hooks/useCanvasState';
// All imports now come from the main 'pixi.js' package :cite[4]
import { Application, Container, Graphics } from 'pixi.js';

/**
 * A tiny local point type used in React-land and our hook.
 * We avoid assigning plain objects to refs typed as PIXI.Point to prevent TS issues.
 */
type PointData = { x: number; y: number };

interface WhiteboardProps {
  width?: number;
  height?: number;
}

export default function Whiteboard({ width = 800, height = 600 }: WhiteboardProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const cameraRef = useRef<PIXI.Container | null>(null);
  const strokesContainerRef = useRef<PIXI.Container | null>(null);

  const {
    state,
    toolMode,
    startStroke,
    addPointToStroke,
    completeStroke,
  } = useCanvasState();

  // Drawing / panning state kept in refs to avoid re-renders
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<PointData | null>(null);

  const isPanningRef = useRef(false);
  const panLastPosRef = useRef<PointData | null>(null);

  // small helper to convert a hex string like "#112233" to number for Pixi lineStyle
  const hexToNumber = (hex: string) => parseInt(hex.replace('#', ''), 16);

  /* ----------------------------
     PIXI Initialization
     ---------------------------- */
 useEffect(() => {
  if (!canvasRef.current) return;

  const initPixi = async () => {
    const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0xffffff, // <-- correct
  antialias: true,
});

    // Use canvas instead of view
    canvasRef.current?.appendChild(app.renderer.view);
    appRef.current = app;

    const camera = new Container();
    const strokesContainer = new Container();
    
    cameraRef.current = camera;
    strokesContainerRef.current = strokesContainer;

    app.stage.addChild(camera);
    camera.addChild(strokesContainer);

    // Use eventMode instead of interactive
  (app.stage as any).eventMode = 'static';
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.renderer.width, app.renderer.height);

    // ... rest of your code
  };

  initPixi();
}, []);
  /* ----------------------------
     Render strokes whenever state changes
     (simple approach: clear and re-draw)
     ---------------------------- */
  useEffect(() => {
    const container = strokesContainerRef.current;
    if (!container) return;

    container.removeChildren();

    // Function to draw a single stroke with the new Graphics API :cite[4]
    const drawStroke = (stroke: any) => {
      if (!stroke.points || stroke.points.length < 2) return;

      const g = new Graphics();

      if (stroke.type === 'draw') {
        g.lineStyle(stroke.width, hexToNumber(stroke.color));
      } else {
        // Eraser: draw with white
        g.lineStyle(stroke.width, 0xffffff);
      }

      g.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        g.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      g.endFill();

      container.addChild(g);
    };

    // draw finished strokes
    state.strokes.forEach(drawStroke);

    // in-progress stroke
    if (state.currentStroke && state.currentStroke.points.length >= 2) {
      const stroke = state.currentStroke;
      const g = new Graphics();

      if (stroke.type === 'draw') {
        g.lineStyle(stroke.width, hexToNumber(stroke.color));
      } else {
        // Visual in-progress eraser stroke (red, semi-transparent)
        g.lineStyle(stroke.width, 0xff0000, 0.3);
      }

      g.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        g.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      g.endFill();

      container.addChild(g);
    }
  }, [state.strokes, state.currentStroke]);

  /* ----------------------------
     Pointer Events (draw / pan)
     ---------------------------- */
  useEffect(() => {
    const app = appRef.current;
    const camera = cameraRef.current;
    const strokesContainer = strokesContainerRef.current;
    if (!app || !camera || !strokesContainer) return;

    // ... (The rest of your pointer event code remains the same, as the event listening API is unchanged)
    // Convert global DOM coordinate (x,y) into world coords relative to camera:
    const globalClientToWorld = (globalPoint: PIXI.Point): PointData => {
      const local = camera.toLocal(globalPoint);
      return { x: local.x, y: local.y };
    };

    const onPointerDown = (ev: any) => {
      const global = ev.global; // In v8, this is directly on the event :cite[3]

      if (toolMode === 'pan') {
        // start pan
        isPanningRef.current = true;
        panLastPosRef.current = { x: global.x, y: global.y };
        return;
      }

      // start drawing
      const world = globalClientToWorld(global);
      lastPointRef.current = { x: world.x, y: world.y };
      isDrawingRef.current = true;

      const color = toolMode === 'erase' ? '#ffffff' : '#000000';
      const width = toolMode === 'erase' ? 20 : 4;

      startStroke({ x: world.x, y: world.y }, color, width);
    };

    const onPointerMove = (ev: any) => {
      const global = ev.global;

      if (toolMode === 'pan') {
        if (!isPanningRef.current || !panLastPosRef.current) return;
        const dx = global.x - panLastPosRef.current.x;
        const dy = global.y - panLastPosRef.current.y;
        // Move camera by screen-space delta; this gives expected pan behavior
        camera.position.x += dx;
        camera.position.y += dy;
        panLastPosRef.current = { x: global.x, y: global.y };
        return;
      }

      if (!isDrawingRef.current) return;
      const world = globalClientToWorld(global);

      if (lastPointRef.current) {
        const dist = Math.hypot(world.x - lastPointRef.current.x, world.y - lastPointRef.current.y);
        if (dist < 2) return; // simple filtering to reduce points
      }

      lastPointRef.current = { x: world.x, y: world.y };
      addPointToStroke({ x: world.x, y: world.y });
    };

    const onPointerUp = (_ev: any) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        panLastPosRef.current = null;
      }
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPointRef.current = null;
        completeStroke();
      }
    };

    // register events on stage
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointermove', onPointerMove);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);

    // cleanup
    return () => {
      app.stage.off('pointerdown', onPointerDown);
      app.stage.off('pointermove', onPointerMove);
      app.stage.off('pointerup', onPointerUp);
      app.stage.off('pointerupoutside', onPointerUp);
    };
  }, [toolMode, startStroke, addPointToStroke, completeStroke]);

  // ... (The wheel effect and JSX return remain unchanged)
  /* ----------------------------
     Zoom handler (wheel) - zoom about cursor
     ---------------------------- */
  useEffect(() => {
    const app = appRef.current;
    const camera = cameraRef.current;
    if (!app || !camera) return;

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = app.renderer.view.getBoundingClientRect();

      // mouse position in view-space
      const mouseX = ev.clientX - rect.left;
      const mouseY = ev.clientY - rect.top;

      // world position before zoom
      const worldBefore = camera.toLocal(new PIXI.Point(mouseX, mouseY));

      const zoomSpeed = 0.0015;
      const zoomFactor = 1 - ev.deltaY * zoomSpeed;
      const clamped = Math.max(0.1, Math.min(10, camera.scale.x * zoomFactor));
      camera.scale.set(clamped, clamped);

      // world position after zoom
      const worldAfter = camera.toLocal(new PIXI.Point(mouseX, mouseY));

      // compensate camera position so the world point stays under cursor
      camera.position.x += (worldAfter.x - worldBefore.x) * camera.scale.x;
      camera.position.y += (worldAfter.y - worldBefore.y) * camera.scale.y;
    };

    app.renderer.view.addEventListener('wheel', onWheel, { passive: false });
    return () => app.renderer.view.removeEventListener('wheel', onWheel);
  }, []);

  /* ----------------------------
     Render container
     ---------------------------- */
  return (
    <div className="w-full h-full relative">
      <div
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
          cursor: toolMode === 'pan' ? 'grab' : 'crosshair',
        }}
      />
    </div>
  );
}