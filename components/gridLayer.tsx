import React, { useEffect, useRef } from "react";
import { Layer, Shape } from "react-konva";
import Konva from "konva";

interface GridLayerProps {
  stage: Konva.Stage | null;
  baseSize?: number; // Distance between dots
  color?: string;    // Dot color
  size?: number;     // Dot radius
}

const GridLayer = React.memo(({
  stage,
  baseSize = 40,
  color = "#aaaaaaff",
  size = 1.5 // Small size looks like Canva/Mural
}: GridLayerProps) => {
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (!stage || !layerRef.current) return;

    // The Magic Fix:
    // Listen to the stage moving (drag) or zooming (transform)
    // and force this specific layer to redraw immediately.
    const handleDraw = () => {
      layerRef.current?.batchDraw();
    };

    stage.on("dragmove transform", handleDraw);

    return () => {
      stage.off("dragmove transform", handleDraw);
    };
  }, [stage]);

  return (
    <Layer ref={layerRef} listening={false}>
      <Shape
        sceneFunc={(context, shape) => {
          if (!stage) return;

          const stageWidth = stage.width();
          const stageHeight = stage.height();

          // Get the current camera view
          const transform = stage.getAbsoluteTransform().copy();
          transform.invert();

          const viewTopLeft = transform.point({ x: 0, y: 0 });
          const viewBottomRight = transform.point({ x: stageWidth, y: stageHeight });

          // Calculate "start" and "end" based on the View, not the World
          // This ensures we ALWAYS draw exactly what the user can see
          const startX = Math.floor(viewTopLeft.x / baseSize) * baseSize;
          const endX = Math.floor(viewBottomRight.x / baseSize) * baseSize + baseSize;

          const startY = Math.floor(viewTopLeft.y / baseSize) * baseSize;
          const endY = Math.floor(viewBottomRight.y / baseSize) * baseSize + baseSize;

          context.beginPath();

          for (let x = startX; x < endX; x += baseSize) {
            for (let y = startY; y < endY; y += baseSize) {
              // Draw a simple circle
              context.moveTo(x + size, y);
              context.arc(x, y, size, 0, Math.PI * 2, true);
            }
          }

          context.fillStyle = color;
          context.fillStrokeShape(shape);
        }}
        // perfectDrawEnabled={false} speeds up rendering significantly
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        stroke={undefined}
        fill={color}
      />
    </Layer>
  );
});

GridLayer.displayName = "GridLayer";

export default GridLayer;