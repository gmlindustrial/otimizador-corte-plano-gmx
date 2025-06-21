
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import type { OptimizationHistoryEntry } from '@/hooks/useOptimizationHistory';

export class PDFReportService {
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

  // Gerar PDF de relatório linear
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
