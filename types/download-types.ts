import Konva from 'konva';

export type DownloadFormat = 'png' | 'jpeg' | 'pdf';

export interface DownloadUtils {
  downloadAsImage: (stage: Konva.Stage, format: 'png' | 'jpeg') => void;
  downloadAsPDF: (stage: Konva.Stage) => void;
}