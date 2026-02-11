/**
 * Tipos e interfaces para exportação de PDF
 */

// Definição de coluna para tabela PDF
export interface PDFTableColumn {
  id: string;
  header: string;
  width: number;
  enabled: boolean;
}

// Opções de exportação PDF
export interface PDFExportOptions {
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  columns: PDFTableColumn[];
  truncatePosition: boolean;
  positionTruncateLength: number;
}

// Colunas padrão da tabela de peças
export const DEFAULT_PDF_COLUMNS: PDFTableColumn[] = [
  { id: 'barra', header: 'Barra', width: 12, enabled: true },
  { id: 'tipo', header: 'Tipo', width: 14, enabled: true },
  { id: 'tag', header: 'TAG', width: 18, enabled: true },
  { id: 'fase', header: 'Fase', width: 12, enabled: true },
  { id: 'pos', header: 'Pos', width: 18, enabled: true },
  { id: 'qtd', header: 'Qtd', width: 10, enabled: true },
  { id: 'comp', header: 'Comp', width: 16, enabled: true },
  { id: 'peso', header: 'Peso', width: 14, enabled: true },
  { id: 'sobra', header: 'Sobra', width: 14, enabled: true },
  { id: 'status', header: 'Status', width: 12, enabled: true },
  { id: 'qc', header: 'QC', width: 10, enabled: false },
  { id: 'obs', header: 'Obs', width: 14, enabled: false },
];

// Opções padrão de exportação
export const DEFAULT_PDF_EXPORT_OPTIONS: PDFExportOptions = {
  orientation: 'portrait',
  fontSize: 7,
  columns: DEFAULT_PDF_COLUMNS,
  truncatePosition: true,
  positionTruncateLength: 7,
};
