/**
 * SheetCuttingLabels — Gera etiquetas PDF para peças de chapas (G5)
 * Tag, dimensões, espessura, material, nº chapa, posição X/Y, rotação
 */

import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';

interface SheetCuttingLabelsProps {
  results: SheetOptimizationResult;
  project: SheetProject | null;
}

export const SheetCuttingLabels = ({ results, project }: SheetCuttingLabelsProps) => {

  const handleGenerateLabels = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');

      // Coletar todas as peças posicionadas
      const allPieces: Array<{
        tag: string;
        width: number;
        height: number;
        x: number;
        y: number;
        rotation: number;
        sheetIndex: number;
        pieceIndex: number;
      }> = [];

      results.sheets.forEach((sheet, sheetIdx) => {
        sheet.pieces.forEach((piece, pieceIdx) => {
          allPieces.push({
            tag: piece.tag || `CH-${pieceIdx + 1}`,
            width: piece.width,
            height: piece.height,
            x: Math.round(piece.x),
            y: Math.round(piece.y),
            rotation: piece.rotation,
            sheetIndex: sheetIdx + 1,
            pieceIndex: pieceIdx + 1,
          });
        });
      });

      if (allPieces.length === 0) {
        toast.error('Nenhuma peça para gerar etiquetas');
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Layout: 2 colunas × 5 linhas = 10 etiquetas por página
      const labelWidth = 90;
      const labelHeight = 50;
      const marginX = 15;
      const marginY = 10;
      const gapX = 5;
      const gapY = 5;
      const cols = 2;
      const rows = 5;
      const labelsPerPage = cols * rows;

      for (let i = 0; i < allPieces.length; i++) {
        const piece = allPieces[i];
        const pageLabel = i % labelsPerPage;
        const col = pageLabel % cols;
        const row = Math.floor(pageLabel / cols);

        if (i > 0 && pageLabel === 0) {
          doc.addPage();
        }

        const x = marginX + col * (labelWidth + gapX);
        const y = marginY + row * (labelHeight + gapY);

        // Borda tracejada
        doc.setDrawColor(150);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([1, 1], 0);
        doc.roundedRect(x, y, labelWidth, labelHeight, 2, 2);
        doc.setLineDashPattern([], 0);

        // Header
        doc.setFillColor(20, 100, 100);
        doc.roundedRect(x, y, labelWidth, 12, 2, 2, 'F');
        doc.rect(x, y + 8, labelWidth, 4, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(project?.name || 'Projeto', x + 3, y + 5);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Chapa ${piece.sheetIndex} | ${project?.material || 'A36'} | ${project?.thickness || 6}mm`, x + 3, y + 10);

        // Tag (grande)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(piece.tag, x + 3, y + 22);

        // Dimensões
        doc.setFontSize(11);
        doc.text(`${piece.width}×${piece.height}mm`, x + labelWidth - 3, y + 22, { align: 'right' });

        // Separador
        doc.setDrawColor(200);
        doc.line(x + 3, y + 25, x + labelWidth - 3, y + 25);

        // Detalhes
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        let detailY = y + 30;
        doc.text(`Posição: X=${piece.x}mm  Y=${piece.y}mm`, x + 3, detailY);
        detailY += 4;
        doc.text(`Rotação: ${piece.rotation}°`, x + 3, detailY);
        detailY += 4;
        doc.text(`Peça ${piece.pieceIndex} de ${results.sheets[piece.sheetIndex - 1]?.pieces.length || '?'}`, x + 3, detailY);

        // Nº chapa badge
        doc.setFillColor(20, 100, 100);
        doc.roundedRect(x + labelWidth - 22, y + 28, 19, 8, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`CH ${piece.sheetIndex}`, x + labelWidth - 12.5, y + 33.5, { align: 'center' });

        // Data
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text(new Date().toLocaleDateString('pt-BR'), x + labelWidth - 3, y + labelHeight - 2, { align: 'right' });
      }

      doc.save(`etiquetas-chapas-${project?.projectNumber || 'projeto'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`${allPieces.length} etiqueta(s) de chapas gerada(s)`);
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      toast.error('Erro ao gerar etiquetas PDF');
    }
  };

  const totalPieces = results.sheets.reduce((sum, s) => sum + s.pieces.length, 0);

  return (
    <Button variant="outline" size="sm" onClick={handleGenerateLabels}>
      <Tag className="w-3.5 h-3.5 mr-1" />
      Etiquetas ({totalPieces})
    </Button>
  );
};
