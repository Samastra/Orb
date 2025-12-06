import jsPDF from 'jspdf';
import Konva from 'konva';

interface ShapeData {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  type?: string;
}

interface BoardElements {
  reactShapes: ShapeData[];
  konvaShapes: ShapeData[];
  stageFrames: ShapeData[];
  images: ShapeData[];
}

interface ContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Maximum export dimensions (base size before pixel ratio)
const MAX_EXPORT_SIZE = 2000;

/**
 * Calculate bounds from shape data arrays (not affected by zoom)
 */
const calculateBoundsFromShapes = (elements: BoardElements): ContentBounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const allShapes = [
    ...elements.reactShapes,
    ...elements.konvaShapes,
    ...elements.stageFrames,
    ...elements.images
  ];

  if (allShapes.length === 0) {
    return { x: 0, y: 0, width: 1920, height: 1080 };
  }

  allShapes.forEach(shape => {
    const x = shape.x || 0;
    const y = shape.y || 0;

    let width = shape.width || 100;
    let height = shape.height || 100;

    // Handle circles
    if (shape.type === 'circle' && shape.radius) {
      width = shape.radius * 2;
      height = shape.radius * 2;
      // Circle x,y is center, so adjust
      minX = Math.min(minX, x - shape.radius);
      minY = Math.min(minY, y - shape.radius);
      maxX = Math.max(maxX, x + shape.radius);
      maxY = Math.max(maxY, y + shape.radius);
      return;
    }

    // Handle ellipses
    if (shape.type === 'ellipse' && shape.radiusX && shape.radiusY) {
      minX = Math.min(minX, x - shape.radiusX);
      minY = Math.min(minY, y - shape.radiusY);
      maxX = Math.max(maxX, x + shape.radiusX);
      maxY = Math.max(maxY, y + shape.radiusY);
      return;
    }

    // Regular shapes (rect, text, image, stageFrame, stickyNote)
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // Add padding for better visual balance
  const padding = 80;

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};

export const downloadAsImage = (
  stage: Konva.Stage,
  format: 'png' | 'jpeg' = 'png',
  elements?: BoardElements
): void => {
  try {
    // Calculate bounds from shape data if available, otherwise fallback
    let bounds: ContentBounds;

    if (elements) {
      bounds = calculateBoundsFromShapes(elements);
      console.log('Calculated bounds from shape data:', bounds);
    } else {
      // Fallback: use stage dimensions
      bounds = {
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height()
      };
      console.log('Using stage dimensions (no elements passed):', bounds);
    }

    // Calculate scale to fit within max export size
    const scaleX = MAX_EXPORT_SIZE / bounds.width;
    const scaleY = MAX_EXPORT_SIZE / bounds.height;
    const exportScale = Math.min(1, Math.min(scaleX, scaleY));

    const exportWidth = Math.ceil(bounds.width * exportScale);
    const exportHeight = Math.ceil(bounds.height * exportScale);

    console.log(`Exporting ${exportWidth}x${exportHeight} (scale: ${exportScale.toFixed(2)})`);

    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Create export stage
    const exportStage = new Konva.Stage({
      container: container,
      width: exportWidth,
      height: exportHeight
    });

    // White background
    const bgLayer = new Konva.Layer();
    bgLayer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width: exportWidth,
      height: exportHeight,
      fill: 'white'
    }));
    exportStage.add(bgLayer);

    // Clone content layers (skip grid layer at index 0)
    const layers = stage.getLayers();
    layers.forEach((layer, index) => {
      if (index === 0) return; // Skip grid

      const clonedLayer = layer.clone();

      // Reset any existing transforms on the layer
      clonedLayer.x(0);
      clonedLayer.y(0);
      clonedLayer.scaleX(1);
      clonedLayer.scaleY(1);

      // Apply offset and scale to move content to export area
      clonedLayer.getChildren().forEach((node) => {
        const newX = (node.x() - bounds.x) * exportScale;
        const newY = (node.y() - bounds.y) * exportScale;
        node.x(newX);
        node.y(newY);
        node.scaleX(node.scaleX() * exportScale);
        node.scaleY(node.scaleY() * exportScale);
      });

      exportStage.add(clonedLayer);
    });

    exportStage.draw();

    // Export with 2x pixel ratio
    const dataURL = exportStage.toDataURL({
      mimeType: `image/${format}`,
      quality: format === 'jpeg' ? 0.92 : 1,
      pixelRatio: 2
    });

    // Download
    const link = document.createElement('a');
    link.download = `orb-board-${Date.now()}.${format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    exportStage.destroy();
    container.remove();

    console.log('Export completed successfully');
  } catch (error) {
    console.error('Export error:', error);
    alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const downloadAsPDF = (
  stage: Konva.Stage,
  elements?: BoardElements
): void => {
  try {
    let bounds: ContentBounds;

    if (elements) {
      bounds = calculateBoundsFromShapes(elements);
    } else {
      bounds = {
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height()
      };
    }

    // Calculate export dimensions
    const scaleX = MAX_EXPORT_SIZE / bounds.width;
    const scaleY = MAX_EXPORT_SIZE / bounds.height;
    const exportScale = Math.min(1, Math.min(scaleX, scaleY));

    const exportWidth = Math.ceil(bounds.width * exportScale);
    const exportHeight = Math.ceil(bounds.height * exportScale);

    console.log(`PDF Export: ${exportWidth}x${exportHeight}`);

    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Create export stage
    const exportStage = new Konva.Stage({
      container: container,
      width: exportWidth,
      height: exportHeight
    });

    // White background
    const bgLayer = new Konva.Layer();
    bgLayer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width: exportWidth,
      height: exportHeight,
      fill: 'white'
    }));
    exportStage.add(bgLayer);

    // Clone content layers
    const layers = stage.getLayers();
    layers.forEach((layer, index) => {
      if (index === 0) return;

      const clonedLayer = layer.clone();

      clonedLayer.x(0);
      clonedLayer.y(0);
      clonedLayer.scaleX(1);
      clonedLayer.scaleY(1);

      clonedLayer.getChildren().forEach((node) => {
        const newX = (node.x() - bounds.x) * exportScale;
        const newY = (node.y() - bounds.y) * exportScale;
        node.x(newX);
        node.y(newY);
        node.scaleX(node.scaleX() * exportScale);
        node.scaleY(node.scaleY() * exportScale);
      });

      exportStage.add(clonedLayer);
    });

    exportStage.draw();

    const dataURL = exportStage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 2
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: exportWidth > exportHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [exportWidth, exportHeight]
    });

    pdf.addImage(dataURL, 'PNG', 0, 0, exportWidth, exportHeight);
    pdf.save(`orb-board-${Date.now()}.pdf`);

    exportStage.destroy();
    container.remove();

    console.log('PDF Export completed');
  } catch (error) {
    console.error('PDF Export error:', error);
    alert('PDF export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};