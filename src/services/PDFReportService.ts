import jsPDF from 'jspdf';
import type { OptimizationResult, Project } from '@/pages/Index';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';

export class PDFReportService {
  private static addHeader(doc: jsPDF, project: Project | SheetProject, title: string, pageNumber: number) {
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Projeto: ${project.projectNumber || 'N/A'}`, 20, 30);
    doc.text(`Cliente: ${project.client || 'N/A'}`, 20, 35);
    doc.text(`Obra: ${(project as any).obra || 'N/A'}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 30);
    doc.text(`Página: ${pageNumber}`, 150, 35);
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
  }

  private static addFooter(doc: jsPDF, project: Project | SheetProject) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Operador: ${(project as any).operador || '_________'}`, 20, pageHeight - 20);
    doc.text(`Turno: ${(project as any).turno || '___'}`, 80, pageHeight - 20);
    doc.text(`QA: ${(project as any).aprovadorQA || '_________'}`, 140, pageHeight - 20);
    doc.text('© Sistema de Otimização - Elite Soldas', 105, pageHeight - 10, { align: 'center' });
  }

  private static addLegend(doc: jsPDF, currentY: number): number {
    // Mantido para compatibilidade mas não utilizado
    return currentY;
  }

  private static extractProfiles(results: OptimizationResult): string {
    const set = new Set<string>();
    results.bars.forEach(bar => {
      bar.pieces.forEach((piece: any) => {
        if (piece.perfil) {
          set.add(piece.perfil);
        }
      });
    });
    return Array.from(set).join(', ');
  }

  static async generateCompleteLinearReport(results: OptimizationResult, barLength: number, project: Project): Promise<void> {
    try {
      const doc = new jsPDF();
      let currentY = 55;
      let pageNumber = 1;

      this.addHeader(doc, project, 'Relatório Completo de Otimização Linear', pageNumber);

    // Resumo Executivo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Calcular métricas de peças e peso
    const totalPieces = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + (piece.quantidade || 1), 0), 0);
    
    const totalWeight = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + ((piece.length / 1000) * (piece.peso_por_metro || 0) * (piece.quantidade || 1)), 0), 0);

    const cutPieces = results.bars.reduce((total, bar) => 
      total + bar.pieces.length, 0);

    const cutWeight = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + ((piece.length / 1000) * (piece.peso_por_metro || 0)), 0), 0);

    doc.text(`Total de Barras: ${results.totalBars}`, 20, currentY);
    doc.text(`Barras NOVAS: ${results.bars.filter((bar: any) => bar.type !== 'leftover').length}`, 100, currentY);
    doc.text(`Eficiência: ${results.efficiency.toFixed(1)}%`, 20, currentY + 5);
    doc.text(`Barras SOBRA: ${results.bars.filter((bar: any) => bar.type === 'leftover').length}`, 100, currentY + 5);
    doc.text(`Total de Peças: ${totalPieces}`, 20, currentY + 10);
    doc.text(`Peso Total: ${totalWeight.toFixed(1)}kg`, 100, currentY + 10);
    doc.text(`Peças Cortadas: ${cutPieces}`, 20, currentY + 15);
    doc.text(`Peso Cortado: ${cutWeight.toFixed(1)}kg`, 100, currentY + 15);
    doc.text(`Desperdício: ${(results.totalWaste / 1000).toFixed(2)}m`, 20, currentY + 20);
    doc.text(`Material: ${(project as any).tipoMaterial || 'N/A'}`, 100, currentY + 20);
    doc.text(`Comprimento da Barra: ${barLength}mm`, 20, currentY + 25);
    doc.text(`Perfil: ${PDFReportService.extractProfiles(results) || 'N/A'}`, 100, currentY + 25);

    // Espaço após resumo
    currentY += 35;

    // Resumo por TAG
    const tagSummary = new Map<string, { count: number; totalLength: number; barras: Set<number> }>();
    results.bars.forEach((bar, barIndex) => {
      bar.pieces.forEach((piece: any) => {
        const tag = piece.tag || 'Entrada Manual';
        if (!tagSummary.has(tag)) {
          tagSummary.set(tag, { count: 0, totalLength: 0, barras: new Set() });
        }
        const summary = tagSummary.get(tag)!;
        summary.count++;
        summary.totalLength += piece.length;
        summary.barras.add(barIndex + 1);
      });
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo por TAG', 20, currentY);
    currentY += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    tagSummary.forEach((data, tag) => {
      if (currentY > 270) {
        doc.addPage();
        pageNumber++;
        this.addHeader(doc, project, 'Relatório Completo de Otimização Linear', pageNumber);
        currentY = 55;
      }
      doc.text(`${tag}: ${data.count} peças, ${(data.totalLength / 1000).toFixed(2)}m`, 20, currentY);
      currentY += 5;
    });

    // Detalhes das Barras
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento das Barras', 20, currentY);
    currentY += 10;

    results.bars.forEach((bar: any, barIndex) => {
      if (currentY > 220) {
        doc.addPage();
        pageNumber++;
        this.addHeader(doc, project, 'Relatório Completo de Otimização Linear', pageNumber);
        currentY = 55;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Título da barra com indicador NOVA/SOBRA
      const barType = bar.type === 'leftover' ? 'SOBRA' : 'NOVA';
      const barTitle = `Barra ${barIndex + 1} - ${barType}`;
      doc.text(barTitle, 20, currentY);
      
      // Localização para sobras
      if (bar.type === 'leftover' && bar.location) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Localização: ${bar.location}`, 120, currentY);
      }
      
      currentY += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Eficiência: ${((bar.totalUsed / barLength) * 100).toFixed(1)}%`, 20, currentY);
      doc.text(`Sobra: ${(bar.waste / 1000).toFixed(3)}m`, 80, currentY);
      
      // Economia para sobras
      if (bar.type === 'leftover' && bar.economySaved) {
        doc.text(`Economia: R$ ${bar.economySaved.toFixed(2)}`, 130, currentY);
      }
      
      currentY += 10;

      // Tabela de peças
      doc.text('Seq.', 20, currentY);
      doc.text('TAG', 30, currentY);
      doc.text('Qtd.', 50, currentY);
      doc.text('Pos.', 60, currentY);
      doc.text('Comprimento', 75, currentY);
      doc.text('Perfil', 115, currentY);
      doc.text('Status', 155, currentY);
      doc.text('Obs.', 175, currentY);
      currentY += 5;

      // Linha da tabela
      doc.line(20, currentY - 2, 195, currentY - 2);
      currentY += 2; // Espaço após a linha

      bar.pieces.forEach((piece: any, pieceIndex) => {
        if (currentY > 275) {
          doc.addPage();
          pageNumber++;
          this.addHeader(doc, project, 'Relatório Completo de Otimização Linear', pageNumber);
          currentY = 55;
        }

        doc.text(`${pieceIndex + 1}`, 20, currentY);
        doc.text(piece.tag || `P${pieceIndex + 1}`, 30, currentY);
        doc.text(`${piece.quantidade || 1}`, 50, currentY);
        doc.text(`${piece.posicao || '-'}`, 60, currentY);
        doc.text(`${piece.length || 0}mm`, 75, currentY);
        doc.text(piece.perfil || '-', 115, currentY);
        doc.text('', 155, currentY); // Status vazio
        doc.text('', 175, currentY); // Observação vazia
        
        // Indicador de reutilização para sobras
        if (bar.type === 'leftover') {
          doc.text('♻', 185, currentY);
        }
        
        currentY += 5;
      });

      if (bar.waste > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Sobra', 20, currentY);
        doc.text('-', 30, currentY);
        doc.text('0', 50, currentY);
        doc.text('-', 60, currentY);
        doc.text(`${bar.waste}mm`, 75, currentY);
        doc.text(bar.type === 'leftover' ? 'Sobra da Sobra' : 'Descarte', 115, currentY);
        doc.text('', 155, currentY);
        doc.text('', 175, currentY);
        doc.setFont('helvetica', 'normal');
        currentY += 5;
      }

      currentY += 10;
    });

      this.addFooter(doc, project);
      doc.save(`relatorio-completo-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF completo:', error);
      alert('Erro ao gerar PDF. Verifique os dados e tente novamente.');
      throw error;
    }
  }

  static async generateSimplifiedLinearReport(results: OptimizationResult, barLength: number, project: Project): Promise<void> {
    try {
      const doc = new jsPDF();
      let currentY = 55;
      let pageNumber = 1;
      const maxBarsPerPage = 4;

      this.addHeader(doc, project, 'Plano de Corte Simplificado - Produção', pageNumber);

    // Resumo Geral
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 20, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Calcular métricas de peças e peso
    const totalPieces = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + (piece.quantidade || 1), 0), 0);
    
    const totalWeight = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + ((piece.length / 1000) * (piece.peso_por_metro || 0) * (piece.quantidade || 1)), 0), 0);

    const cutPieces = results.bars.reduce((total, bar) => 
      total + bar.pieces.length, 0);

    const cutWeight = results.bars.reduce((total, bar) => 
      total + bar.pieces.reduce((barTotal, piece: any) => 
        barTotal + ((piece.length / 1000) * (piece.peso_por_metro || 0)), 0), 0);

    doc.text(`Total de Barras: ${results.totalBars}`, 20, currentY);
    doc.text(`Barras NOVAS: ${results.bars.filter((bar: any) => bar.type !== 'leftover').length}`, 100, currentY);
    currentY += 5;
    doc.text(`Eficiência: ${results.efficiency.toFixed(1)}%`, 20, currentY);
    doc.text(`Barras SOBRA: ${results.bars.filter((bar: any) => bar.type === 'leftover').length}`, 100, currentY);
    currentY += 5;
    doc.text(`Total de Peças: ${totalPieces}`, 20, currentY);
    doc.text(`Peso Total: ${totalWeight.toFixed(1)}kg`, 100, currentY);
    currentY += 5;
    doc.text(`Peças Cortadas: ${cutPieces}`, 20, currentY);
    doc.text(`Peso Cortado: ${cutWeight.toFixed(1)}kg`, 100, currentY);
    currentY += 5;
    doc.text(`Desperdício: ${(results.totalWaste / 1000).toFixed(2)}m`, 20, currentY);
    doc.text(`Material: ${(project as any).tipoMaterial || 'N/A'}`, 100, currentY);
    currentY += 5;
    doc.text(`Perfil: ${PDFReportService.extractProfiles(results) || 'N/A'}`, 20, currentY);
    currentY += 15;

    // Espaço antes da lista de barras
    currentY += 10;

    // Processar barras em grupos para múltiplas páginas
    const totalBars = results.bars.length;
    let processedBars = 0;

    while (processedBars < totalBars) {
      const barsToProcess = Math.min(maxBarsPerPage, totalBars - processedBars);
      const currentBars = results.bars.slice(processedBars, processedBars + barsToProcess);

      // Se não é a primeira página, adicionar nova página
      if (processedBars > 0) {
        doc.addPage();
        pageNumber++;
        this.addHeader(doc, project, 'Plano de Corte Simplificado - Produção', pageNumber);
        currentY = 55;
      }

      // Título da seção
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Barras ${processedBars + 1} a ${processedBars + barsToProcess} de ${totalBars}`, 20, currentY);
      currentY += 10;

      // Processar cada barra do grupo atual
      currentBars.forEach((bar: any, localIndex) => {
        const globalBarIndex = processedBars + localIndex;
        
        // Verificar se há espaço suficiente para a barra
        if (currentY > 220) {
          doc.addPage();
          pageNumber++;
          this.addHeader(doc, project, 'Plano de Corte Simplificado - Produção', pageNumber);
          currentY = 55;
        }

        // Cabeçalho da barra com indicador
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Identificar TAGs na barra
        const tagsNaBarra = new Set((bar.pieces as any[])
          .filter(p => p.tag)
          .map(p => p.tag));
        
        const barType = bar.type === 'leftover' ? 'SOBRA' : 'NOVA';
        let barTitle = `Barra ${globalBarIndex + 1} - ${barType}`;
        
        if (tagsNaBarra.size > 0) {
          barTitle += ` - TAGs: ${Array.from(tagsNaBarra).join(', ')}`;
        }
        
        doc.text(barTitle, 20, currentY);
        currentY += 5;

        // Informações da barra
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Eficiência: ${((bar.totalUsed / barLength) * 100).toFixed(1)}%`, 20, currentY);
        doc.text(`Utilizado: ${(bar.totalUsed / 1000).toFixed(2)}m`, 70, currentY);
        doc.text(`Sobra: ${(bar.waste / 1000).toFixed(3)}m`, 120, currentY);
        
        // Localização ou economia
        if (bar.type === 'leftover') {
          if (bar.location) {
            doc.text(`Local: ${bar.location}`, 20, currentY + 4);
          }
          if (bar.economySaved) {
            doc.text(`Economia: R$ ${bar.economySaved.toFixed(2)}`, 70, currentY + 4);
          }
          currentY += 4;
        }
        
        currentY += 8;

        // Tabela de peças
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Seq.', 20, currentY);
        doc.text('TAG', 30, currentY);
        doc.text('Qtd.', 45, currentY);
        doc.text('Pos.', 55, currentY);
        doc.text('Comp.', 70, currentY);
        doc.text('Perfil', 105, currentY);
        doc.text('Status', 140, currentY);
        doc.text('Obs.', 170, currentY);
        if (bar.type === 'leftover') {
          doc.text('♻', 188, currentY);
        }
        currentY += 3;

        // Linha da tabela
        doc.line(20, currentY, 190, currentY);
        currentY += 3;

        // Peças da barra
        doc.setFont('helvetica', 'normal');
        bar.pieces.forEach((piece: any, pieceIndex) => {
          doc.text(`${pieceIndex + 1}`, 20, currentY);
          doc.text(piece.tag || `P${pieceIndex + 1}`, 30, currentY);
          doc.text(`${piece.quantidade || 1}`, 45, currentY);
          doc.text(`${piece.posicao || '-'}`, 55, currentY);
          doc.text(`${piece.length || 0}mm`, 70, currentY);
          doc.text(piece.perfil || '-', 105, currentY);
          doc.text('', 140, currentY);
          doc.text('', 170, currentY);
          if (bar.type === 'leftover') {
            doc.text('♻', 188, currentY);
          }
          currentY += 4;
        });

        // Sobra se existir
        if (bar.waste > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Sobra', 20, currentY);
          doc.text('-', 30, currentY);
          doc.text('0', 45, currentY);
          doc.text('-', 55, currentY);
          doc.text(`${bar.waste}mm`, 70, currentY);
          doc.text(bar.type === 'leftover' ? 'Sobra da Sobra' : 'Descarte', 105, currentY);
          doc.text('', 140, currentY);
          doc.text('', 170, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 4;
        }

        currentY += 8;
      });

      processedBars += barsToProcess;
    }

    // Página final com resumo e checklist
    doc.addPage();
    pageNumber++;
    this.addHeader(doc, project, 'Plano de Corte Simplificado - Produção', pageNumber);
    currentY = 55;

    // Resumo Final
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Final e Controle', 20, currentY);
    currentY += 10;

    // Tabela resumo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Barra', 20, currentY);
    doc.text('Tipo', 35, currentY);
    doc.text('Peças', 50, currentY);
    doc.text('Eficiência', 85, currentY);
    doc.text('Sobra', 115, currentY);
    doc.text('Status', 140, currentY);
    currentY += 5;

    doc.line(20, currentY, 160, currentY);
    currentY += 3;

    doc.setFont('helvetica', 'normal');
    results.bars.forEach((bar: any, index) => {
      const barType = bar.type === 'leftover' ? 'SOBRA' : 'NOVA';

      doc.text(`${index + 1}`, 20, currentY);
      doc.text(barType, 35, currentY);
      doc.text(`${bar.pieces.length}`, 50, currentY);
      doc.text(`${((bar.totalUsed / barLength) * 100).toFixed(1)}%`, 85, currentY);
      doc.text(`${(bar.waste / 1000).toFixed(3)}m`, 115, currentY);
      doc.text('□', 140, currentY);
      currentY += 4;
    });

    // Totais
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 20, currentY);
    doc.text(`${results.totalBars}`, 35, currentY);
    doc.text(`${results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}`, 50, currentY);
    doc.text(`${results.efficiency.toFixed(1)}%`, 85, currentY);
    doc.text(`${(results.totalWaste / 1000).toFixed(2)}m`, 115, currentY);
    currentY += 15;

    // Check-list do operador
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Check-list do Operador', 20, currentY);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const checklist = [
      '□ Material conferido e correto',
      '□ Barras verificadas e posicionadas',
      '□ TAGs das peças conferidas',
      '□ Conjuntos organizados por prioridade',
      '□ Primeira peça cortada e validada',
      '□ Dimensões conferidas com padrão',
      '□ Sobras identificadas e separadas',
      '□ Relatório validado pelo inspetor QA'
    ];

    checklist.forEach((item, index) => {
      if (index < 4) {
        doc.text(item, 20, currentY);
      } else {
        doc.text(item, 110, currentY - (4 * 5));
      }
      if (index < 4) currentY += 5;
    });

      this.addFooter(doc, project);
      doc.save(`plano-corte-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF simplificado:', error);
      alert('Erro ao gerar PDF simplificado. Verifique os dados e tente novamente.');
      throw error;
    }
  }

  static async generateLinearReport(results: OptimizationResult, barLength: number, project: Project): Promise<void> {
    return this.generateCompleteLinearReport(results, barLength, project);
  }

  static async generateSheetReport(results: SheetOptimizationResult, project: SheetProject): Promise<void> {
    const doc = new jsPDF();
    let currentY = 55;

    this.addHeader(doc, project, 'Relatório de Otimização de Chapas', 1);

    // Resumo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Otimização', 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Chapas: ${results.totalSheets}`, 20, currentY);
    doc.text(`Eficiência Média: ${results.averageEfficiency.toFixed(1)}%`, 20, currentY + 5);
    doc.text(`Peso Total: ${results.totalWeight.toFixed(1)} kg`, 20, currentY + 10);
    currentY += 20;

    // Detalhes das chapas
    results.sheets.forEach((sheet, index) => {
      if (currentY > 250) {
        doc.addPage();
        this.addHeader(doc, project, 'Relatório de Otimização de Chapas', Math.ceil(index / 3) + 1);
        currentY = 55;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Chapa ${index + 1}`, 20, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Eficiência: ${sheet.efficiency.toFixed(1)}%`, 20, currentY);
      doc.text(`Peso: ${sheet.weight.toFixed(1)} kg`, 20, currentY + 5);
      doc.text(`Peças: ${sheet.pieces.length}`, 20, currentY + 10);
      currentY += 20;

      // Lista de peças
      sheet.pieces.forEach((piece, pieceIndex) => {
        if (currentY > 270) {
          doc.addPage();
          this.addHeader(doc, project, 'Relatório de Otimização de Chapas', Math.ceil((index * 10 + pieceIndex) / 30) + 1);
          currentY = 55;
        }
        doc.text(`${piece.tag}: ${piece.width}×${piece.height}mm`, 25, currentY);
        currentY += 5;
      });

      currentY += 10;
    });

    this.addFooter(doc, project);
    doc.save(`relatorio-chapas-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async generateMaterialReport(materials: any[]): Promise<void> {
    const doc = new jsPDF();
    let currentY = 30;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Materiais', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 30);
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    currentY = 45;

    // Estatísticas gerais
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 20, currentY);
    currentY += 10;

    const activeMaterials = materials.filter(m => m.status === 'active').length;
    const totalUsage = materials.reduce((sum, m) => sum + m.count, 0);
    const totalValue = materials.reduce((sum, m) => sum + (m.price || 0), 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Materiais: ${materials.length}`, 20, currentY);
    doc.text(`Materiais Ativos: ${activeMaterials}`, 20, currentY + 5);
    doc.text(`Total de Usos: ${totalUsage}`, 20, currentY + 10);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 20, currentY + 15);
    currentY += 25;

    // Lista de materiais
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento dos Materiais', 20, currentY);
    currentY += 10;

    // Cabeçalho da tabela
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Material', 20, currentY);
    doc.text('Status', 80, currentY);
    doc.text('Usos', 110, currentY);
    doc.text('Último Uso', 130, currentY);
    doc.text('Preço/kg', 170, currentY);
    currentY += 5;

    doc.line(20, currentY, 190, currentY);
    currentY += 5;

    // Dados dos materiais
    doc.setFont('helvetica', 'normal');
    materials.forEach((material) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 30;
      }

      doc.text(material.name.substring(0, 40), 20, currentY);
      doc.text(material.status === 'active' ? 'Ativo' : 'Arquivado', 80, currentY);
      doc.text(material.count.toString(), 110, currentY);
      doc.text(material.lastUsed, 130, currentY);
      doc.text(material.price ? `R$ ${material.price.toFixed(2)}` : 'N/A', 170, currentY);
      currentY += 5;
    });

    // Rodapé
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('© Sistema de Otimização - Elite Soldas', 105, pageHeight - 10, { align: 'center' });

    doc.save(`relatorio-materiais-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
