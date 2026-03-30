/**
 * CuttingLabels — Gera etiquetas PDF imprimíveis por peça cortada (G5)
 * Tag, posição, perfil, comprimento, nº amarrado, projeto
 */

import { Button } from '@/components/ui/button';
import { Printer, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface LabelPiece {
  tag?: string;
  posicao?: string;
  perfil?: string;
  length: number;
  barIndex: number;
  pieceIndex: number;
  bundleSize?: number;
  bundleId?: string;
}

interface CuttingLabelsProps {
  bars: Array<{
    id: string;
    pieces: Array<{
      length: number;
      tag?: string;
      posicao?: string;
      perfil?: string;
      label?: string;
    }>;
    _bundleSize?: number;
    _bundleId?: string;
  }>;
  projectName?: string;
  projectNumber?: string;
  barLength: number;
}

export const CuttingLabels = ({ bars, projectName, projectNumber, barLength }: CuttingLabelsProps) => {

  const handleGenerateLabels = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');

      // Coletar todas as peças
      const allPieces: LabelPiece[] = [];
      bars.forEach((bar, barIdx) => {
        bar.pieces.forEach((piece, pieceIdx) => {
          // Se amarrado, multiplicar por bundleSize
          const bundleSize = (bar as any)._bundleSize || 1;
          for (let copy = 0; copy < bundleSize; copy++) {
            allPieces.push({
              tag: piece.tag || piece.label,
              posicao: piece.posicao,
              perfil: piece.perfil,
              length: piece.length,
              barIndex: barIdx + 1,
              pieceIndex: pieceIdx + 1,
              bundleSize: bundleSize > 1 ? bundleSize : undefined,
              bundleId: (bar as any)._bundleId,
            });
          }
        });
      });

      if (allPieces.length === 0) {
        toast.error('Nenhuma peça para gerar etiquetas');
        return;
      }

      // Configurar PDF — etiquetas em formato paisagem para caber mais
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

      let labelIndex = 0;

      for (let i = 0; i < allPieces.length; i++) {
        const piece = allPieces[i];
        const pageLabel = labelIndex % labelsPerPage;
        const col = pageLabel % cols;
        const row = Math.floor(pageLabel / cols);

        if (labelIndex > 0 && pageLabel === 0) {
          doc.addPage();
        }

        const x = marginX + col * (labelWidth + gapX);
        const y = marginY + row * (labelHeight + gapY);

        // Borda da etiqueta
        doc.setDrawColor(150);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, labelWidth, labelHeight, 2, 2);

        // Linha de corte (tracejada)
        doc.setLineDashPattern([1, 1], 0);
        doc.roundedRect(x, y, labelWidth, labelHeight, 2, 2);
        doc.setLineDashPattern([], 0);

        // Header da etiqueta
        doc.setFillColor(40, 40, 50);
        doc.roundedRect(x, y, labelWidth, 12, 2, 2, 'F');
        doc.rect(x, y + 8, labelWidth, 4, 'F'); // Preencher cantos inferiores

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(projectName || 'Projeto', x + 3, y + 5);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(projectNumber || '', x + 3, y + 10);

        // Corpo da etiqueta
        doc.setTextColor(0, 0, 0);

        // Tag (grande, destaque)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(piece.tag || `P${piece.pieceIndex}`, x + 3, y + 22);

        // Comprimento
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${piece.length}mm`, x + labelWidth - 3, y + 22, { align: 'right' });

        // Linha separadora
        doc.setDrawColor(200);
        doc.line(x + 3, y + 25, x + labelWidth - 3, y + 25);

        // Detalhes
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        let detailY = y + 30;
        if (piece.perfil) {
          doc.text(`Perfil: ${piece.perfil}`, x + 3, detailY);
          detailY += 4;
        }
        if (piece.posicao) {
          doc.text(`Posição: ${piece.posicao}`, x + 3, detailY);
          detailY += 4;
        }
        doc.text(`Barra: ${piece.barIndex}  |  Peça: ${piece.pieceIndex}`, x + 3, detailY);

        // Badge de amarrado
        if (piece.bundleSize) {
          doc.setFillColor(59, 130, 246); // blue
          doc.roundedRect(x + labelWidth - 20, y + 28, 17, 7, 1, 1, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`×${piece.bundleSize}`, x + labelWidth - 11.5, y + 33, { align: 'center' });
        }

        // Data no canto inferior
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.text(new Date().toLocaleDateString('pt-BR'), x + labelWidth - 3, y + labelHeight - 2, { align: 'right' });

        labelIndex++;
      }

      doc.save(`etiquetas-corte-${projectNumber || 'sem-projeto'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`${allPieces.length} etiqueta(s) gerada(s)`);
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      toast.error('Erro ao gerar etiquetas PDF');
    }
  };

  const totalPieces = bars.reduce((sum, bar) => {
    const bundleSize = (bar as any)._bundleSize || 1;
    return sum + bar.pieces.length * bundleSize;
  }, 0);

  return (
    <Button variant="outline" size="sm" onClick={handleGenerateLabels}>
      <Tag className="w-3.5 h-3.5 mr-1" />
      Etiquetas ({totalPieces})
    </Button>
  );
};
