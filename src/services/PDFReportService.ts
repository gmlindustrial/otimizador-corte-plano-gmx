
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import type { OptimizationHistoryEntry } from '@/hooks/useOptimizationHistory';
import type { OptimizationResult, Project } from '@/pages/Index';

export class PDFReportService {
  // Gerar PDF completo de relatório linear - NOVO MÉTODO
  static async generateCompleteLinearReport(
    results: OptimizationResult,
    barLength: number,
    project: Project
  ): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    // Cabeçalho
    pdf.setFontSize(18);
    pdf.text('RELATÓRIO DE OTIMIZAÇÃO LINEAR', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.text(`Projeto: ${project.projectNumber}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Cliente: ${project.client}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 15;
    
    // Métricas principais
    pdf.setFontSize(14);
    pdf.text('MÉTRICAS PRINCIPAIS', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.text(`Total de Barras: ${results.totalBars}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Eficiência: ${results.efficiency.toFixed(1)}%`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Desperdício: ${(results.totalWaste / 1000).toFixed(2)}m`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Comprimento da Barra: ${barLength}mm`, 20, yPosition);
    yPosition += 15;
    
    // Lista completa de peças organizadas por barra
    pdf.setFontSize(14);
    pdf.text('LISTA COMPLETA DE PEÇAS', 20, yPosition);
    yPosition += 10;
    
    // Cabeçalho da tabela
    pdf.setFontSize(9);
    pdf.text('Barra', 20, yPosition);
    pdf.text('Posição', 45, yPosition);
    pdf.text('Comprimento (mm)', 70, yPosition);
    pdf.text('Material', 130, yPosition);
    pdf.text('Status', 170, yPosition);
    yPosition += 8;
    
    // Linha separadora
    pdf.line(20, yPosition - 2, 190, yPosition - 2);
    
    results.bars.forEach((bar, barIndex) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
        
        // Repetir cabeçalho da tabela
        pdf.setFontSize(9);
        pdf.text('Barra', 20, yPosition);
        pdf.text('Posição', 45, yPosition);
        pdf.text('Comprimento (mm)', 70, yPosition);
        pdf.text('Material', 130, yPosition);
        pdf.text('Status', 170, yPosition);
        yPosition += 8;
        pdf.line(20, yPosition - 2, 190, yPosition - 2);
      }
      
      // Título da barra
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`BARRA ${barIndex + 1} - Eficiência: ${((bar.totalUsed / barLength) * 100).toFixed(1)}%`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      // Peças da barra
      bar.pieces.forEach((piece, pieceIndex) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`${barIndex + 1}`, 25, yPosition);
        pdf.text(`${pieceIndex + 1}`, 50, yPosition);
        pdf.text(`${piece.length}`, 85, yPosition);
        pdf.text(`${project.tipoMaterial || 'Material'}`, 135, yPosition);
        pdf.text('Otimizado', 175, yPosition);
        yPosition += 6;
      });
      
      // Sobra da barra
      if (bar.waste > 0) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setTextColor(255, 0, 0); // Vermelho para sobra
        pdf.text(`${barIndex + 1}`, 25, yPosition);
        pdf.text('Sobra', 50, yPosition);
        pdf.text(`${bar.waste}`, 85, yPosition);
        pdf.text('Desperdício', 135, yPosition);
        pdf.text('Descarte', 175, yPosition);
        pdf.setTextColor(0, 0, 0); // Voltar para preto
        yPosition += 8;
      }
      
      yPosition += 4; // Espaço entre barras
    });
    
    // Nova página para resumo detalhado
    pdf.addPage();
    yPosition = 20;
    
    pdf.setFontSize(14);
    pdf.text('RESUMO DETALHADO POR BARRA', 20, yPosition);
    yPosition += 15;
    
    // Cabeçalho da tabela resumo
    pdf.setFontSize(9);
    pdf.text('Barra', 20, yPosition);
    pdf.text('Qtd Peças', 45, yPosition);
    pdf.text('Utilizado (mm)', 75, yPosition);
    pdf.text('Sobra (mm)', 115, yPosition);
    pdf.text('Eficiência (%)', 150, yPosition);
    yPosition += 8;
    
    pdf.line(20, yPosition - 2, 180, yPosition - 2);
    
    results.bars.forEach((bar, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(8);
      pdf.text(`Barra ${index + 1}`, 25, yPosition);
      pdf.text(`${bar.pieces.length}`, 55, yPosition);
      pdf.text(`${bar.totalUsed}`, 85, yPosition);
      pdf.text(`${bar.waste}`, 125, yPosition);
      pdf.text(`${((bar.totalUsed / barLength) * 100).toFixed(1)}%`, 160, yPosition);
      yPosition += 6;
    });
    
    // Totais
    yPosition += 5;
    pdf.line(20, yPosition, 180, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAIS', 25, yPosition);
    pdf.text(`${results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}`, 55, yPosition);
    pdf.text(`${results.bars.reduce((sum, bar) => sum + bar.totalUsed, 0)}`, 85, yPosition);
    pdf.text(`${results.totalWaste}`, 125, yPosition);
    pdf.text(`${results.efficiency.toFixed(1)}%`, 160, yPosition);
    
    // Análise final
    yPosition += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('ANÁLISE DE RESULTADOS:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    const analysis = [
      `• Eficiência Alcançada: ${results.efficiency.toFixed(1)}% (${results.efficiency >= 85 ? 'Excelente' : results.efficiency >= 75 ? 'Bom' : 'Pode melhorar'})`,
      `• Material Utilizado: ${((results.totalBars * barLength - results.totalWaste) / 1000).toFixed(2)}m`,
      `• Material Desperdiçado: ${(results.totalWaste / 1000).toFixed(2)}m`,
      `• Economia vs Corte Linear: ~${Math.max(0, 25 - results.wastePercentage).toFixed(1)}% de redução`
    ];
    
    analysis.forEach(line => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 25, yPosition);
      yPosition += 6;
    });
    
    // Salvar o PDF
    pdf.save(`relatorio-completo-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Gerar PDF de relatório de chapas
  static async generateSheetReport(
    results: SheetOptimizationResult,
    project: SheetProject
  ): Promise<void> {
    const pdf = new jsPDF();
    
    // Cabeçalho
    pdf.setFontSize(20);
    pdf.text('RELATÓRIO DE OTIMIZAÇÃO DE CHAPAS', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Projeto: ${project.name}`, 20, 35);
    pdf.text(`Cliente: ${project.client}`, 20, 45);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 55);
    
    // Métricas principais
    pdf.setFontSize(14);
    pdf.text('MÉTRICAS PRINCIPAIS', 20, 75);
    
    pdf.setFontSize(10);
    pdf.text(`Total de Chapas: ${results.totalSheets}`, 20, 90);
    pdf.text(`Eficiência Média: ${results.averageEfficiency.toFixed(1)}%`, 20, 100);
    pdf.text(`Peso Total: ${results.totalWeight.toFixed(2)} kg`, 20, 110);
    pdf.text(`Custo Material: R$ ${results.materialCost.toFixed(2)}`, 20, 120);
    
    // Detalhes por chapa
    let yPosition = 140;
    results.sheets.forEach((sheet, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Chapa ${index + 1}`, 20, yPosition);
      
      pdf.setFontSize(10);
      pdf.text(`Eficiência: ${sheet.efficiency.toFixed(1)}%`, 30, yPosition + 10);
      pdf.text(`Peças: ${sheet.pieces.length}`, 30, yPosition + 20);
      pdf.text(`Área Utilizada: ${(sheet.utilizedArea / 1000000).toFixed(3)} m²`, 30, yPosition + 30);
      
      yPosition += 50;
    });
    
    // Salvar o PDF
    pdf.save(`relatorio-chapas-${project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Gerar PDF de relatório linear (método original mantido para compatibilidade)
  static async generateLinearReport(
    historyEntry: OptimizationHistoryEntry
  ): Promise<void> {
    const pdf = new jsPDF();
    
    // Cabeçalho
    pdf.setFontSize(20);
    pdf.text('RELATÓRIO DE OTIMIZAÇÃO LINEAR', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Projeto: ${historyEntry.project.projectNumber}`, 20, 35);
    pdf.text(`Cliente: ${historyEntry.project.client}`, 20, 45);
    pdf.text(`Data: ${new Date(historyEntry.date).toLocaleDateString('pt-BR')}`, 20, 55);
    
    // Métricas principais
    pdf.setFontSize(14);
    pdf.text('MÉTRICAS PRINCIPAIS', 20, 75);
    
    pdf.setFontSize(10);
    pdf.text(`Total de Barras: ${historyEntry.results.totalBars}`, 20, 90);
    pdf.text(`Eficiência: ${historyEntry.results.efficiency.toFixed(1)}%`, 20, 100);
    pdf.text(`Desperdício: ${(historyEntry.results.totalWaste / 1000).toFixed(2)}m`, 20, 110);
    pdf.text(`Comprimento da Barra: ${historyEntry.barLength}mm`, 20, 120);
    
    // Lista de peças
    pdf.setFontSize(14);
    pdf.text('LISTA DE PEÇAS', 20, 140);
    
    let yPosition = 155;
    historyEntry.pieces.forEach((piece, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(10);
      pdf.text(`${index + 1}. ${piece.length}mm x ${piece.quantity} unidades`, 20, yPosition);
      yPosition += 10;
    });
    
    // Salvar o PDF
    pdf.save(`relatorio-linear-${historyEntry.project.projectNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Gerar PDF de relatório de materiais
  static async generateMaterialReport(materials: any[]): Promise<void> {
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text('RELATÓRIO DE MATERIAIS', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
    pdf.text(`Total de Materiais: ${materials.length}`, 20, 45);
    
    let yPosition = 65;
    materials.forEach((material, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text(`${index + 1}. ${material.name}`, 20, yPosition);
      
      pdf.setFontSize(10);
      pdf.text(`Quantidade: ${material.count}`, 30, yPosition + 10);
      pdf.text(`Último uso: ${material.lastUsed}`, 30, yPosition + 20);
      pdf.text(`Status: ${material.status === 'active' ? 'Ativo' : 'Arquivado'}`, 30, yPosition + 30);
      
      yPosition += 45;
    });
    
    pdf.save(`relatorio-materiais-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Capturar elemento HTML como PDF
  static async generateFromElement(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(fileName);
  }
}
