
export interface AutoCADCutPiece {
  id: string;
  length: number;
  quantity: number;
  // Campos específicos do AutoCAD
  obra?: string;
  conjunto?: string;
  posicao?: string;
  perfil?: string;
  material?: string;
  peso?: number;
  tag?: string;
  dimensoes?: {
    comprimento: number;
    largura: number;
  };
}
