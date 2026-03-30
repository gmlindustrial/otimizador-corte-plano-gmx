/**
 * BundleEconomyReport — Relatório de economia amarrado vs individual (G6)
 * Card comparativo + exportação PDF
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingDown,
  TrendingUp,
  Layers,
  Timer,
  DollarSign,
  Weight,
  FileText,
  Download,
} from 'lucide-react';
import type { BundleOptimizationResult } from '@/types/bundle';

interface BundleEconomyReportProps {
  bundleResults: BundleOptimizationResult;
  barLength: number;
  /** Resultado da otimização individual para comparação */
  individualTotalBars?: number;
  individualEfficiency?: number;
  /** Custo por barra (R$) */
  costPerBar?: number;
  /** Peso por metro (kg/m) — média dos perfis */
  avgKgPerMeter?: number;
  projectName?: string;
}

export const BundleEconomyReport = ({
  bundleResults,
  barLength,
  individualTotalBars,
  individualEfficiency,
  costPerBar = 50,
  avgKgPerMeter = 10,
  projectName,
}: BundleEconomyReportProps) => {
  const { summary, bundles, individualBars } = bundleResults;

  // Cálculos de economia
  const bundleTotalBars = summary.totalBars;
  const indivBars = individualTotalBars || bundleTotalBars; // fallback
  const barsSaved = Math.max(0, indivBars - bundleTotalBars);
  const costSaved = barsSaved * costPerBar;
  const weightSaved = barsSaved * (barLength / 1000) * avgKgPerMeter;
  const setupTimeSaved = summary.setupTimeSaved;

  // Desperdício
  const bundleWasteMm = summary.totalWaste;
  const bundleWasteMeters = bundleWasteMm / 1000;
  const bundleWasteKg = bundleWasteMeters * avgKgPerMeter;

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Economia — Otimização por Amarrado', 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (projectName) doc.text(`Projeto: ${projectName}`, 20, 32);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 38);
      doc.text(`Barra: ${barLength}mm`, 150, 32);

      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Resumo geral
      let y = 55;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Geral', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const rows = [
        ['Amarrados gerados', `${bundles.length}`],
        ['Barras individuais', `${individualBars.length}`],
        ['Total de barras (amarrado)', `${bundleTotalBars}`],
        ['Total de barras (individual)', `${indivBars}`],
        ['Barras economizadas', `${barsSaved}`],
        ['Eficiência média', `${summary.averageEfficiency.toFixed(1)}%`],
        ['Desperdício total', `${bundleWasteMeters.toFixed(1)}m (${bundleWasteKg.toFixed(1)}kg)`],
      ];

      for (const [label, value] of rows) {
        doc.text(label, 25, y);
        doc.text(value, 130, y);
        y += 7;
      }

      // Economia
      y += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Economia', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const economyRows = [
        ['Barras economizadas', `${barsSaved} barras`],
        ['Economia em material', `R$ ${costSaved.toFixed(2)}`],
        ['Peso economizado', `${weightSaved.toFixed(1)} kg`],
        ['Tempo de setup economizado', `${setupTimeSaved.toFixed(0)} minutos`],
      ];

      for (const [label, value] of economyRows) {
        doc.text(label, 25, y);
        doc.text(value, 130, y);
        y += 7;
      }

      // Detalhamento por amarrado
      if (bundles.length > 0) {
        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhamento por Amarrado', 20, y);
        y += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Perfil', 25, y);
        doc.text('Barras', 90, y);
        doc.text('Peças/Barra', 115, y);
        doc.text('Sobra/Barra', 145, y);
        doc.text('Eficiência', 175, y);
        y += 2;
        doc.line(25, y, 190, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        for (const bundle of bundles) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(bundle.profileDescription.substring(0, 25), 25, y);
          doc.text(`×${bundle.bundleSize}`, 90, y);
          doc.text(`${bundle.pattern.pieces.length}`, 115, y);
          doc.text(`${bundle.pattern.wastePerBar}mm`, 145, y);
          doc.text(`${bundle.efficiency.toFixed(1)}%`, 175, y);
          y += 6;
        }
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.text('Gerado por Otimizador Plano Corte GMX', 105, pageHeight - 10, { align: 'center' });

      doc.save(`economia-amarrado-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Relatório de Economia
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparativo principal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-secondary rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Corte Individual</p>
            <p className="text-2xl font-bold">{indivBars}</p>
            <p className="text-xs text-muted-foreground">barras</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
            <p className="text-xs text-primary mb-1">Corte por Amarrado</p>
            <p className="text-2xl font-bold text-primary">{bundleTotalBars}</p>
            <p className="text-xs text-muted-foreground">barras</p>
          </div>
        </div>

        {/* Indicadores de economia */}
        {barsSaved > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <Layers className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-500">{barsSaved}</p>
                <p className="text-[10px] text-muted-foreground">barras a menos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-500">R$ {costSaved.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">economizado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <Weight className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-500">{weightSaved.toFixed(0)}kg</p>
                <p className="text-[10px] text-muted-foreground">material</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <Timer className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-500">{setupTimeSaved.toFixed(0)}min</p>
                <p className="text-[10px] text-muted-foreground">setup</p>
              </div>
            </div>
          </div>
        )}

        {barsSaved === 0 && (
          <div className="text-center p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
            Nenhuma economia identificada — amarrado e individual usam o mesmo número de barras
          </div>
        )}

        {/* Detalhamento por amarrado */}
        {bundles.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Detalhamento por Amarrado</p>
              {bundles.map(b => (
                <div key={b.bundleId} className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      <Layers className="w-2.5 h-2.5 mr-0.5" />
                      ×{b.bundleSize}
                    </Badge>
                    <span>{b.profileDescription}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{b.pattern.pieces.length} peça(s)/barra</span>
                    <span>sobra {b.pattern.wastePerBar}mm</span>
                    <Badge variant="secondary" className="text-[10px]">{b.efficiency.toFixed(1)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
