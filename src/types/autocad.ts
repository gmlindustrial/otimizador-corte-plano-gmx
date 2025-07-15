
export interface AutoCADCutPiece {
  id: string;
  length: number;
  quantity: number;
  // Campos específicos do AutoCAD
  obra?: string;
  tag?: string;        // Novo mapeamento: CONJUNTO → tag (formato novo) ou MARCA → tag (formato antigo)
  posicao?: string;    // Novo mapeamento: TAG → posição (formato novo) ou ITEM → posição (formato antigo) 
  perfil?: string;
  material?: string;
  peso?: number;
  page?: number;       // Página do relatório
  dimensoes?: {
    comprimento: number;
    largura: number;
  };
}
