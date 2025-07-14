
export interface AutoCADCutPiece {
  id: string;
  length: number;
  quantity: number;
  // Campos específicos do AutoCAD
  obra?: string;
  tag?: string;
  posicao?: string;
  perfil?: string;
  material?: string;
  peso?: number;
  dimensoes?: {
    comprimento: number;
    largura: number;
  };
}
