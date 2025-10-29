import jsPDF from 'jspdf';
import Konva from 'konva';
import type { DownloadFormat } from '@/types/download-types';

export const downloadAsImage = (stage: Konva.Stage, format: 'png' | 'jpeg' = 'png'): void => {
  const dataURL = stage.toDataURL({
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
};

export const downloadAsPDF = (stage: Konva.Stage): void => {
  const dataURL = stage.toDataURL({
    mimeType: 'image/png',
    quality: 0.9,
    pixelRatio: 2
  });
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [stage.width(), stage.height()]
  });
  
  pdf.addImage(dataURL, 'PNG', 0, 0, stage.width(), stage.height());
  pdf.save(`orb-board-${Date.now()}.pdf`);
};