import { useState, useCallback, useRef } from 'react';

interface SnapLine {
  orientation: 'V' | 'H';
  points: number[];
}

// Huge threshold just for testing (50px)
const SNAP_THRESHOLD = 50; 

export const useSnapGuides = () => {
  const [guides, setGuides] = useState<SnapLine[]>([]);
  // Throttling logs so we don't crash your browser
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
    
    // --- DIAGNOSTIC LOG (Runs once every 10 frames) ---
    logCounter.current++;
    if (logCounter.current % 10 === 0) {
       console.log("📏 SNAP DEBUG:", { 
          dragId: dragNodeId, 
          x: Math.round(currentX), 
          y: Math.round(currentY), 
          totalShapesInArray: allShapes.length,
          shapesToCheck: allShapes.filter(s => s.id !== dragNodeId).length
       });
    }
    // --------------------------------------------------

    const dragNode = allShapes.find(s => s.id === dragNodeId);
    if (!dragNode) return { x: currentX, y: currentY };

    let w = dragNode.width || 0;
    let h = dragNode.height || 0;
    // Normalize dimensions
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

    let newX = currentX;
    let newY = currentY;
    const newGuides: SnapLine[] = [];
    let snappedX = false;
    let snappedY = false;

    for (const other of allShapes) {
      if (other.id === dragNodeId) continue; 
      if (other.isLocked) continue;

      let ow = other.width || 0;
      let oh = other.height || 0;
      let ox = other.x;
      let oy = other.y;
      
      // Normalize other shapes
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

      if (!snappedX) {
        const snap = (val: number, targetVal: number) => {
           if (Math.abs(val - targetVal) < SNAP_THRESHOLD) {
             console.log("🎯 MATCH FOUND X!"); // Success log
             newX = newX + (targetVal - val);
             snappedX = true;
             newGuides.push({ orientation: 'V', points: [targetVal, Math.min(box.t, target.t) - 50, targetVal, Math.max(box.b, target.b) + 50] });
             return true;
           }
           return false;
        };
        snap(box.cx, target.cx) || snap(box.l, target.l) || snap(box.r, target.r) || snap(box.l, target.r) || snap(box.r, target.l);
      }

      if (!snappedY) {
        const snap = (val: number, targetVal: number) => {
           if (Math.abs(val - targetVal) < SNAP_THRESHOLD) {
             console.log("🎯 MATCH FOUND Y!"); // Success log
             newY = newY + (targetVal - val);
             snappedY = true;
             newGuides.push({ orientation: 'H', points: [Math.min(box.l, target.l) - 50, targetVal, Math.max(box.r, target.r) + 50, targetVal] });
             return true;
           }
           return false;
        };
        snap(box.cy, target.cy) || snap(box.t, target.t) || snap(box.b, target.b) || snap(box.t, target.b) || snap(box.b, target.t);
      }
      
      if (snappedX && snappedY) break;
    }

    if (newGuides.length > 0) setGuides(newGuides);
    
    return { x: newX, y: newY };

  }, []);

  return { guides, getSnappedPosition, clearGuides };
};