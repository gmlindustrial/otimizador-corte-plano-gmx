
export interface CutPiece {
  id: string;
  length: number;
  quantity: number;
  tag?: string;
  conjunto?: string;
  obra?: string;
  perfil?: string;
  material?: string;
  peso?: number;
  posicao?: string;
  dimensoes?: {
    comprimento: number;
    largura: number;
  };
}
