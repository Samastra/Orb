import { useState, useCallback, useRef } from 'react';

interface SnapLine {
  orientation: 'V' | 'H';
  points: number[];
}

// REDUCED THRESHOLD: 8px prevents the "sticky trap" feeling. 
// You can easily "break out" of the snap by moving 9px away.
const SNAP_THRESHOLD = 8;

export const useSnapGuides = () => {
  const [guides, setGuides] = useState<SnapLine[]>([]);
  const logCounter = useRef(0);

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  const getSnappedPosition = useCallback((
    dragNodeId: string,
    currentX: number,
    currentY: number,
    allShapes: any[]
  ) => {

    const dragNode = allShapes.find(s => s.id === dragNodeId);
    if (!dragNode) return { x: currentX, y: currentY };

    let w = dragNode.width || 0;
    let h = dragNode.height || 0;
    if (dragNode.type === 'circle') { w = (dragNode.radius || 0) * 2; h = w; }
    if (dragNode.type === 'ellipse') { w = (dragNode.radiusX || 0) * 2; h = (dragNode.radiusY || 0) * 2; }

    const box = {
      id: dragNodeId,
      l: currentX,
      r: currentX + w,
      t: currentY,
      b: currentY + h,
      cx: currentX + w / 2,
      cy: currentY + h / 2,
    };

    const newGuides: SnapLine[] = [];

    // Find ALL possible snaps first, then pick the best one
    let bestSnapX: { diff: number; value: number; guide: SnapLine } | null = null;
    let bestSnapY: { diff: number; value: number; guide: SnapLine } | null = null;

    for (const other of allShapes) {
      if (other.id === dragNodeId) continue;
      if (other.isLocked) continue;

      let ow = other.width || 0;
      let oh = other.height || 0;
      let ox = other.x;
      let oy = other.y;

      if (other.type === 'circle') { const r = other.radius || 0; ox -= r; oy -= r; ow = r * 2; oh = r * 2; }
      else if (other.type === 'ellipse') { const rx = other.radiusX || 0; const ry = other.radiusY || 0; ox -= rx; oy -= ry; ow = rx * 2; oh = ry * 2; }

      const target = {
        l: ox,
        r: ox + ow,
        t: oy,
        b: oy + oh,
        cx: ox + ow / 2,
        cy: oy + oh / 2,
      };

      // --- X CHECKS (Inline to satisfy TS control flow) ---
      const xPairs = [
        { src: box.l, dest: target.l }, { src: box.l, dest: target.r },
        { src: box.r, dest: target.l }, { src: box.r, dest: target.r },
        { src: box.cx, dest: target.cx }
      ];

      for (const { src, dest } of xPairs) {
        const diff = dest - src;
        if (Math.abs(diff) < SNAP_THRESHOLD) {
          if (!bestSnapX || Math.abs(diff) < Math.abs(bestSnapX.diff)) {
            bestSnapX = {
              diff,
              value: dest,
              guide: { orientation: 'V', points: [dest, Math.min(box.t, target.t) - 50, dest, Math.max(box.b, target.b) + 50] }
            };
          }
        }
      }

      // --- Y CHECKS (Inline to satisfy TS control flow) ---
      const yPairs = [
        { src: box.t, dest: target.t }, { src: box.t, dest: target.b },
        { src: box.b, dest: target.t }, { src: box.b, dest: target.b },
        { src: box.cy, dest: target.cy }
      ];

      for (const { src, dest } of yPairs) {
        const diff = dest - src;
        if (Math.abs(diff) < SNAP_THRESHOLD) {
          if (!bestSnapY || Math.abs(diff) < Math.abs(bestSnapY.diff)) {
            bestSnapY = {
              diff,
              value: dest,
              guide: { orientation: 'H', points: [Math.min(box.l, target.l) - 50, dest, Math.max(box.r, target.r) + 50, dest] }
            };
          }
        }
      }
    }

    // Apply the SINGLE best snap found
    let finalX = currentX;
    let finalY = currentY;

    if (bestSnapX) {
      finalX += bestSnapX.diff;
      newGuides.push(bestSnapX.guide);
    }
    if (bestSnapY) {
      finalY += bestSnapY.diff;
      newGuides.push(bestSnapY.guide);
    }

    if (newGuides.length > 0) setGuides(newGuides);

    return { x: finalX, y: finalY };

  }, []);

  return { guides, getSnappedPosition, clearGuides };
};