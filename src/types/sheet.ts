
export interface SheetCutPiece {
  id: string;
  width: number;      // largura em mm
  height: number;     // altura em mm  
  quantity: number;
  tag: string;        // CH581, CH582, etc.
  allowRotation: boolean; // permite rotação 90°
  thickness?: number; // para diferentes espessuras
  geometry?: {
    type: 'rectangle' | 'polygon' | 'circle' | 'complex';
    points?: Array<{ x: number; y: number }>; // para polígonos complexos
    radius?: number; // para círculos
    boundingBox: { width: number; height: number };
    area: number;
    perimeter: number;
  };
  material?: string;
  cadFile?: string; // nome do arquivo CAD original
}

export interface SheetProject {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  obra: string;
  lista: string;
  revisao: string;
  sheetWidth: number;    // ex: 2550mm
  sheetHeight: number;   // ex: 6000mm
  thickness: number;     // 3mm a 100mm
  kerf: number;         // largura corte plasma/oxicorte
  process: 'plasma' | 'oxicorte' | 'both';
  material: string;     // A36, A572, etc.
  operador: string;
  turno: string;
  aprovadorQA: string;
  validacaoQA: boolean;
  date: string;
}

export interface SheetPlacedPiece {
  x: number; 
  y: number;    // coordenadas
  width: number; 
  height: number;
  rotation: number;        // 0° ou 90°
  tag: string;
  color: string;
  originalPiece: SheetCutPiece;
}

export interface SheetOptimizationResult {
  sheets: Array<{
    id: string;
    pieces: SheetPlacedPiece[];
    efficiency: number;
    wasteArea: number;
    utilizedArea: number;
    weight: number;
  }>;
  totalSheets: number;
  totalWasteArea: number;
  averageEfficiency: number;
  totalWeight: number;       // importante para A36/A572
  materialCost: number;
  cuttingSequence?: any;     // sequência de corte
  gcode?: string[];          // código G
  optimizationMetrics?: {    // métricas de otimização
    optimizationTime: number;
    algorithm: string;
    convergence: boolean;
  };
}
