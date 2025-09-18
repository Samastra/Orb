"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";

interface GridLayerProps {
  stage: Konva.Stage | null;
  baseSize?: number;
  color?: string;
}

export default function GridLayer({
  stage,
  baseSize = 50,
  color = "#c9c8c8ff",
}: GridLayerProps) {
  const layerRef = useRef<Konva.Layer | null>(null);
  const [gridSize, setGridSize] = useState(baseSize);

useEffect(() => {
  if (!stage) return;

  if (!layerRef.current) {
    const layer = new Konva.Layer();
    layerRef.current = layer;
    stage.add(layer);
  }

  const layer = layerRef.current;

  const drawGrid = () => {
    if (!layer) return;
    layer.destroyChildren();

    const scale = stage.scaleX();
    let step = baseSize;
    if (scale > 2) step = baseSize / 2;
    else if (scale < 0.5) step = baseSize * 2;

    setGridSize(step);

    const width = stage.width() / scale;
    const height = stage.height() / scale;

    const offsetX = -stage.x() / scale;
    const offsetY = -stage.y() / scale;

    const startX = Math.floor(offsetX / step) * step;
    const startY = Math.floor(offsetY / step) * step;

    for (let x = startX; x < offsetX + width; x += step) {
      layer.add(new Konva.Line({
        points: [x, offsetY, x, offsetY + height],
        stroke: color,
        strokeWidth: Math.max(1 / scale, 0.5),
      }));
    }

    for (let y = startY; y < offsetY + height; y += step) {
      layer.add(new Konva.Line({
        points: [offsetX, y, offsetX + width, y],
        stroke: color,
        strokeWidth: Math.max(1 / scale, 0.5),
      }));
    }

    layer.zIndex(0)
    layer.batchDraw();
  };

  drawGrid();

  // ✅ Corrected listeners
  stage.on("dragmove wheel", drawGrid);

  return () => {
    stage.off("dragmove wheel", drawGrid);
  };
}, [stage, baseSize, color]);
    return null;
}
