import jsPDF from 'jspdf';
import Konva from 'konva';

export const downloadAsImage = (stage: Konva.Stage, format: 'png' | 'jpeg' = 'png'): void => {
  // Create a temporary layer with white background
  const tempLayer = new Konva.Layer();
  const backgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: 'white' // Add white background
  });
  tempLayer.add(backgroundRect);
  
  // Clone the stage to avoid modifying the original
  const tempStage = new Konva.Stage({
    container: document.createElement('div'),
    width: stage.width(),
    height: stage.height()
  });
  
  tempStage.add(tempLayer);
  
  // Add all existing layers to the temp stage
  stage.getLayers().forEach(layer => {
    const clonedLayer = layer.clone();
    tempStage.add(clonedLayer);
  });
  
  const dataURL = tempStage.toDataURL({
    mimeType: `image/${format}`,
    quality: 0.9,
    pixelRatio: 2
  });
  
  const link = document.createElement('a');
  link.download = `orb-board-${Date.now()}.${format}`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  tempStage.destroy();
};

export const downloadAsPDF = (stage: Konva.Stage): void => {
  // Use the same approach for PDF
  const tempLayer = new Konva.Layer();
  const backgroundRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: 'white'
  });
  tempLayer.add(backgroundRect);
  
  const tempStage = new Konva.Stage({
    container: document.createElement('div'),
    width: stage.width(),
    height: stage.height()
  });
  
  tempStage.add(tempLayer);
  stage.getLayers().forEach(layer => {
    const clonedLayer = layer.clone();
    tempStage.add(clonedLayer);
  });
  
  const dataURL = tempStage.toDataURL({
    mimeType: 'image/png',
    quality: 0.9,
    pixelRatio: 2
  });
  
  const pdf = new jsPDF({
    orientation: stage.width() > stage.height() ? 'landscape' : 'portrait',
    unit: 'px',
    format: [stage.width(), stage.height()]
  });
  
  pdf.addImage(dataURL, 'PNG', 0, 0, stage.width(), stage.height());
  pdf.save(`orb-board-${Date.now()}.pdf`);
  
  tempStage.destroy();
};