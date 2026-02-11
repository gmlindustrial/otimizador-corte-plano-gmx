import jsPDF from "jspdf";
import type { OptimizationResult, Project } from "@/pages/Index";
import type { SheetOptimizationResult, SheetProject } from "@/types/sheet";
import type {
  PecaComEmenda,
  EmendaInfo,
  SegmentoEmenda,
} from "@/types/project";
import type { PDFExportOptions, PDFTableColumn } from "@/types/pdfExport";
import { DEFAULT_PDF_EXPORT_OPTIONS } from "@/types/pdfExport";
import { supabase } from "@/integrations/supabase/client";

export class PDFReportService {
  private static addHeader(
    doc: jsPDF,
    project: Project | SheetProject,
    title: string,
    pageNumber: number
  ) {
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Projeto: ${project.projectNumber || "N/A"}`, 20, 30);
    doc.text(`Cliente: ${project.client || "N/A"}`, 20, 35);
    doc.text(`Obra: ${(project as any).obra || "N/A"}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 150, 30);
    doc.text(`Página: ${pageNumber}`, 150, 35);

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);
  }

  private static addFooter(doc: jsPDF, project: Project | SheetProject) {
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Operador: ${(project as any).operador || "_________"}`,
      20,
      pageHeight - 20
    );
    doc.text(`Turno: ${(project as any).turno || "___"}`, 80, pageHeight - 20);
    doc.text(
      `QA: ${(project as any).aprovadorQA || "_________"}`,
      140,
      pageHeight - 20
    );
    doc.text("© Sistema de Otimização - Elite Soldas", 105, pageHeight - 10, {
      align: "center",
    });
  }

  private static addLegend(doc: jsPDF, currentY: number): number {
    // Mantido para compatibilidade mas não utilizado
    return currentY;
  }

  // Trunca posição longa para mostrar apenas os últimos N caracteres
  private static truncatePosition(position: string, maxLength: number = 7): string {
    if (!position || position.length <= maxLength) return position || '-';
    return position.slice(-maxLength);
  }

  // Calcula larguras das colunas baseado na orientação
  private static calculateColumnLayout(
    columns: PDFTableColumn[],
    orientation: 'portrait' | 'landscape'
  ): { colWidths: number[]; colStarts: number[] } {
    const enabledColumns = columns.filter(c => c.enabled);
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const margin = 20;
    const availableWidth = pageWidth - (margin * 2);

    const totalRequestedWidth = enabledColumns.reduce((sum, col) => sum + col.width, 0);
    const scaleFactor = totalRequestedWidth > availableWidth
      ? availableWidth / totalRequestedWidth
      : 1;

    const colWidths = enabledColumns.map(col => Math.floor(col.width * scaleFactor));
    const colStarts: number[] = [];
    colWidths.reduce((acc, width, i) => {
      colStarts[i] = acc;
      return acc + width;
    }, margin);

    return { colWidths, colStarts };
  }

  // Obtém valor da coluna para uma peça
  private static getColumnValue(
    columnId: string,
    piece: any,
    barIndex: number,
    pieceIndex: number,
    bar: any,
    options: PDFExportOptions
  ): string {
    switch (columnId) {
      case 'barra':
        return `${barIndex + 1}`;
      case 'tipo':
        return bar.type === 'leftover' ? 'Sobra' : 'Nova';
      case 'tag':
        return piece.tag || `P${pieceIndex + 1}`;
      case 'fase':
        return piece.fase || '-';
      case 'pos':
        return options.truncatePosition
          ? this.truncatePosition(piece.posicao, options.positionTruncateLength)
          : (piece.posicao || '-');
      case 'qtd':
        return `${piece.quantidade || 1}`;
      case 'comp':
        return `${piece.length || 0}mm`;
      case 'peso':
        return `${(piece.peso || 0).toFixed(2)}kg`;
      case 'sobra':
        return `${(bar.waste / 1000).toFixed(2)}m`;
      case 'status':
        return piece.cortada ? 'OK' : '';
      case 'qc':
        return '';
      case 'obs':
        return '';
      default:
        return '-';
    }
  }

  private static extractProfiles(results: OptimizationResult): string {
    const set = new Set<string>();
    results.bars.forEach((bar) => {
      bar.pieces.forEach((piece: any) => {
        if (piece.perfil) {
          set.add(piece.perfil);
        }
      });
    });
    return Array.from(set).join(", ");
  }

  static async generateCompleteLinearReport(
    results: OptimizationResult,
    barLength: number,
    project: Project,
    listName?: string
  ): Promise<void> {
    try {
      const doc = new jsPDF();
      let currentY = 55;
      let pageNumber = 1;

      this.addHeader(
        doc,
        project,
        "Relatório Completo de Otimização Linear",
        pageNumber
      );

      // Verificar se existem emendas para este projeto
      const emendasData = await this.getEmendasData(project.id);
      const hasEmendas = emendasData && emendasData.length > 0;

      // Resumo Executivo
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 20, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      // Calcular métricas de peças e peso
      const totalPieces = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.reduce(
            (barTotal, piece: any) => barTotal + (piece.quantidade || 1),
            0
          ),
        0
      );

      const totalWeight = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.reduce((barTotal, piece: any) => {
            // Priorizar peso extraído do arquivo
            const weight = piece.peso || 0;
            return barTotal + weight * (piece.quantidade || 1);
          }, 0),
        0
      );

      const cutPieces = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.filter((piece: any) => piece.cortada === true).length,
        0
      );

      const cutWeight = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces
            .filter((piece: any) => piece.cortada === true)
            .reduce((barTotal, piece: any) => {
              // Priorizar peso extraído do arquivo para cálculo correto
              const weight = piece.peso || 0;
              return barTotal + weight * (piece.quantidade || 1);
            }, 0),
        0
      );

      doc.text(`Total de Barras: ${results.totalBars}`, 100, currentY);
      doc.text(
        `Barras NOVAS: ${
          results.bars.filter((bar: any) => bar.type !== "leftover").length
        }`,
        20,
        currentY + 5
      );
      doc.text(
        `Barras SOBRA: ${
          results.bars.filter((bar: any) => bar.type === "leftover").length
        }`,
        100,
        currentY + 5
      );
      doc.text(
        `Eficiência: ${(results.efficiency || 0).toFixed(1)}%`,
        20,
        currentY + 10
      );
      doc.text(`Total de Peças: ${totalPieces}`, 100, currentY + 10);
      doc.text(`Peso Total: ${totalWeight.toFixed(1)}kg`, 20, currentY + 15);
      doc.text(`Peso Cortado: ${cutWeight.toFixed(1)}kg`, 100, currentY + 15);
      doc.text(`Peças Cortadas: ${cutPieces}`, 20, currentY + 20);
      doc.text(
        `Desperdício: ${((results.totalWaste || 0) / 1000).toFixed(2)}m`,
        100,
        currentY + 20
      );
      doc.text(
        `Material: ${(project as any).tipoMaterial || "N/A"}`,
        20,
        currentY + 25
      );
      doc.text(`Comprimento da Barra: ${barLength}mm`, 100, currentY + 25);
      doc.text(
        `Perfil: ${PDFReportService.extractProfiles(results) || "N/A"}`,
        20,
        currentY + 30
      );

      // Adicionar informações de emendas se existirem
      if (hasEmendas) {
        const totalEmendas = emendasData.length;
        const emendasObrigatorias = emendasData.filter(
          (e) => e.peca_tag?.includes("OBRIG") || false
        ).length;
        doc.text(`Total de Emendas: ${totalEmendas}`, 20, currentY + 35);
        doc.text(
          `Emendas Obrigatórias: ${emendasObrigatorias}`,
          100,
          currentY + 35
        );
        currentY += 40;
      } else {
        currentY += 35;
      }

      // Adicionar seção de Plano de Emendas se existirem emendas
      if (hasEmendas) {
        currentY = await this.addEmendaPlan(
          doc,
          emendasData,
          currentY,
          project,
          pageNumber
        );
      }

      // Resumo por TAG
      const tagSummary = new Map<
        string,
        { count: number; totalLength: number; barras: Set<number> }
      >();
      results.bars.forEach((bar, barIndex) => {
        bar.pieces.forEach((piece: any) => {
          const tag = piece.tag || "Entrada Manual";
          if (!tagSummary.has(tag)) {
            tagSummary.set(tag, {
              count: 0,
              totalLength: 0,
              barras: new Set(),
            });
          }
          const summary = tagSummary.get(tag)!;
          summary.count++;
          summary.totalLength += piece.length;
          summary.barras.add(barIndex + 1);
        });
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo por TAG", 20, currentY);
      currentY += 10;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      tagSummary.forEach((data, tag) => {
        if (currentY > 270) {
          doc.addPage();
          pageNumber++;
          this.addHeader(
            doc,
            project,
            "Relatório Completo de Otimização Linear",
            pageNumber
          );
          currentY = 55;
        }
        doc.text(
          `${tag}: ${data.count} peças, ${(data.totalLength / 1000).toFixed(
            2
          )}m`,
          20,
          currentY
        );
        currentY += 5;
      });

      // Detalhes das Barras
      currentY += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento das Barras", 20, currentY);
      currentY += 10;

      results.bars.forEach((bar: any, barIndex) => {
        if (currentY > 220) {
          doc.addPage();
          pageNumber++;
          this.addHeader(
            doc,
            project,
            "Relatório Completo de Otimização Linear",
            pageNumber
          );
          currentY = 55;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        // Título da barra com indicador NOVA/SOBRA
        const barType = bar.type === "leftover" ? "SOBRA" : "NOVA";
        const barTitle = `Barra ${barIndex + 1} - ${barType}`;
        doc.text(barTitle, 20, currentY);

        // Localização para sobras
        if (bar.type === "leftover" && bar.location) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(`Localização: ${bar.location}`, 120, currentY);
        }

        currentY += 5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Eficiência: ${((bar.totalUsed / barLength) * 100).toFixed(1)}%`,
          20,
          currentY
        );
        doc.text(`Sobra: ${(bar.waste / 1000).toFixed(3)}m`, 80, currentY);

        // Economia para sobras
        if (bar.type === "leftover" && bar.economySaved) {
          doc.text(
            `Economia: R$ ${(bar.economySaved || 0).toFixed(2)}`,
            130,
            currentY
          );
        }

        currentY += 10;

        // Tabela de peças
        doc.text("Seq.", 20, currentY);
        doc.text("TAG", 30, currentY);
        doc.text("Fase", 45, currentY);
        doc.text("Pos.", 60, currentY);
        doc.text("Qtd.", 75, currentY);
        doc.text("Comprimento", 85, currentY);
        doc.text("Perfil", 125, currentY);
        doc.text("Status", 165, currentY);
        doc.text("Obs.", 185, currentY);
        currentY += 5;

        // Linha da tabela
        doc.line(20, currentY - 2, 195, currentY - 2);
        currentY += 2; // Espaço após a linha

        bar.pieces.forEach((piece: any, pieceIndex) => {
          if (currentY > 275) {
            doc.addPage();
            pageNumber++;
            this.addHeader(
              doc,
              project,
              "Relatório Completo de Otimização Linear",
              pageNumber
            );
            currentY = 55;
          }

          doc.text(`${pieceIndex + 1}`, 20, currentY);
          // Verificar se a peça tem emenda
          const pecaComEmenda = hasEmendas
            ? emendasData.find((e) => e.peca_tag === piece.tag)
            : null;

          const tagText = pecaComEmenda
            ? `🔗 ${piece.tag || `P${pieceIndex + 1}`}`
            : `${piece.tag || `P${pieceIndex + 1}`}`;

          doc.text(tagText, 30, currentY);
          doc.text(`${piece.posicao || "-"}`, 50, currentY);
          doc.text(`${piece.quantidade || 1}`, 65, currentY);
          doc.text(`${piece.length || 0}mm`, 75, currentY);
          doc.text(piece.perfil || "-", 115, currentY);
          doc.text(piece.cortada ? "OK" : "", 155, currentY);

          // Observação sobre emenda
          const obsText = pecaComEmenda ? "Emenda" : "";
          doc.text(obsText, 175, currentY);

          // Indicador de reutilização para sobras
          if (bar.type === "leftover") {
            doc.text("♻", 185, currentY);
          }

          currentY += 5;
        });

        if (bar.waste > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Sobra", 20, currentY);
          doc.text("-", 30, currentY);
          doc.text("-", 50, currentY);
          doc.text("0", 65, currentY);
          doc.text(`${bar.waste}mm`, 75, currentY);
          doc.text(
            bar.type === "leftover" ? "Sobra da Sobra" : "Descarte",
            115,
            currentY
          );
          doc.text("", 155, currentY);
          doc.text("", 175, currentY);
          doc.setFont("helvetica", "normal");
          currentY += 5;
        }

        currentY += 10;
      });

      this.addFooter(doc, project);
      doc.save(
        `relatorio-completo-${project.projectNumber}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Erro ao gerar PDF completo:", error);
      alert("Erro ao gerar PDF. Verifique os dados e tente novamente.");
      throw error;
    }
  }

  static async generateSimplifiedLinearReport(
    results: OptimizationResult,
    barLength: number,
    project: Project,
    listName?: string,
    options?: PDFExportOptions
  ): Promise<void> {
    try {
      const effectiveOptions = options || DEFAULT_PDF_EXPORT_OPTIONS;
      const doc = new jsPDF({
        orientation: effectiveOptions.orientation,
        unit: 'mm',
        format: 'a4'
      });
      let currentY = 50;
      let pageNumber = 1;

      this.addHeader(doc, project, `Lista de Corte - ${listName}`, pageNumber);

      // ==== INFORMAÇÕES DO PROJETO ====
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informações da Lista", 20, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const formatDate = (date: Date) => {
        return date.toLocaleDateString("pt-BR");
      };

      const totalPieces = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.reduce(
            (barTotal, piece: any) => barTotal + (piece.quantidade || 1),
            0
          ),
        0
      );

      const totalWeight = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.reduce(
            (barTotal, piece: any) => barTotal + (piece.peso || 0),
            0
          ),
        0
      );

      // Calcular peças cortadas para estatísticas
      const cutPieces = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces.filter((piece: any) => piece.cortada === true).length,
        0
      );

      const cutWeight = results.bars.reduce(
        (total, bar) =>
          total +
          bar.pieces
            .filter((piece: any) => piece.cortada === true)
            .reduce((barTotal, piece: any) => barTotal + (piece.peso || 0), 0),
        0
      );

      const progressPercent =
        totalPieces > 0 ? ((cutPieces / totalPieces) * 100).toFixed(1) : "0.0";

      // Organizar campos em 2 colunas agrupando dados relacionados
      const infoFields = [
        {
          label1: "Qtd Barras:",
          value1: results.totalBars,
          label2: "Peças Cortadas:",
          value2: `${cutPieces} (${progressPercent}%)`,
        },
        {
          label1: "Qtd Peças:",
          value1: totalPieces,
          label2: "Qtd. Barras Estoque GMX:",
          value2: "",
        },
        {
          label1: "Peso Total:",
          value1: `${totalWeight.toFixed(2)}kg`,

          label2: "Qtd. Barras Compradas:",
          value2: "",
        },
        {
          label1: "Peso Cortado:",
          value1: `${cutWeight.toFixed(2)}kg`,
          label2: "Total Barras:",
          value2: "",
        },
      ];

      const spacingY = 5; // menor espaçamento vertical
      const labelOffset = 0;
      const valueOffset = 35;
      const col1X = 20;
      const col2X = 110;

      infoFields.forEach(({ label1, value1, label2, value2 }) => {
        if (label1) {
          doc.setFont("helvetica", "bold");
          doc.text(label1, col1X + labelOffset, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(`${value1}`, col1X + valueOffset, currentY);
        }

        if (label2) {
          doc.setFont("helvetica", "bold");
          doc.text(label2, col2X + labelOffset, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(`${value2}`, col2X + valueOffset, currentY);
        }

        currentY += spacingY;
      });

      currentY += 4;

      // ==== TABELA DE PEÇAS ====
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Tabela Geral de Peças", 20, currentY);
      currentY += 8;

      // Usar colunas dinâmicas baseadas nas opções
      const enabledColumns = effectiveOptions.columns.filter(c => c.enabled);
      const headers = enabledColumns.map(c => c.header);
      const { colWidths, colStarts } = this.calculateColumnLayout(
        effectiveOptions.columns,
        effectiveOptions.orientation
      );

      const rowHeight = effectiveOptions.fontSize <= 7 ? 5 : 6;
      const pageMaxY = effectiveOptions.orientation === 'landscape' ? 190 : 280;

      const drawTableRow = (values: string[], y: number, isHeader = false, columnIds?: string[]) => {
        values.forEach((text, i) => {
          const x = colStarts[i];
          const w = colWidths[i];

          // Caixa
          doc.rect(x, y, w, rowHeight);

          // Texto centralizado verticalmente
          doc.setFont("helvetica", isHeader ? "bold" : "normal");
          doc.setFontSize(effectiveOptions.fontSize);

          // Para coluna de posição, usar o texto como está (já foi truncado pelo modal)
          // Para outras colunas, truncar se necessário
          const colId = columnIds ? columnIds[i] : null;
          let displayText = text;

          if (colId !== 'pos') {
            const maxChars = Math.floor(w / (effectiveOptions.fontSize * 0.32));
            if (text.length > maxChars) {
              displayText = text.slice(0, maxChars - 1) + '.';
            }
          }

          doc.text(displayText, x + 1, y + (rowHeight * 0.7));
        });
      };

      const columnIds = enabledColumns.map(c => c.id);
      drawTableRow(headers, currentY, true, columnIds);
      currentY += rowHeight;

      results.bars.forEach((bar: any, barIndex: number) => {
        bar.pieces.forEach((piece: any, pieceIndex: number) => {
          if (currentY + rowHeight > pageMaxY) {
            doc.addPage();
            pageNumber++;
            this.addHeader(
              doc,
              project,
              `Lista de Corte - ${project.name}`,
              pageNumber
            );
            currentY = 55;
            drawTableRow(headers, currentY, true, columnIds);
            currentY += rowHeight;
          }

          // Construir linha com valores das colunas habilitadas
          const row = enabledColumns.map(col =>
            this.getColumnValue(col.id, piece, barIndex, pieceIndex, bar, effectiveOptions)
          );

          drawTableRow(row, currentY, false, columnIds);
          currentY += rowHeight;
        });
      });

      this.addFooter(doc, project);
      doc.save(
        `tabela-corte-${project.projectNumber}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Erro ao gerar PDF simplificado:", error);
      alert(
        "Erro ao gerar PDF simplificado. Verifique os dados e tente novamente."
      );
      throw error;
    }
  }

  static async generateLinearReport(
    results: OptimizationResult,
    barLength: number,
    project: Project,
    listName?: string
  ): Promise<void> {
    return this.generateCompleteLinearReport(
      results,
      barLength,
      project,
      listName
    );
  }

  static async generateSheetReport(
    results: SheetOptimizationResult,
    project: SheetProject
  ): Promise<void> {
    const doc = new jsPDF();
    let currentY = 55;

    this.addHeader(doc, project, "Relatório de Otimização de Chapas", 1);

    // Resumo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo da Otimização", 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Chapas: ${results.totalSheets}`, 20, currentY);
    doc.text(
      `Eficiência Média: ${(results.averageEfficiency || 0).toFixed(1)}%`,
      20,
      currentY + 5
    );
    doc.text(
      `Peso Total: ${(results.totalWeight || 0).toFixed(1)} kg`,
      20,
      currentY + 10
    );
    currentY += 20;

    // Detalhes das chapas
    results.sheets.forEach((sheet, index) => {
      if (currentY > 250) {
        doc.addPage();
        this.addHeader(
          doc,
          project,
          "Relatório de Otimização de Chapas",
          Math.ceil(index / 3) + 1
        );
        currentY = 55;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Chapa ${index + 1}`, 20, currentY);
      currentY += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Eficiência: ${(sheet.efficiency || 0).toFixed(1)}%`, 20, currentY);
      doc.text(`Peso: ${(sheet.weight || 0).toFixed(1)} kg`, 20, currentY + 5);
      doc.text(`Peças: ${sheet.pieces.length}`, 20, currentY + 10);
      currentY += 20;

      // Lista de peças
      sheet.pieces.forEach((piece, pieceIndex) => {
        if (currentY > 270) {
          doc.addPage();
          this.addHeader(
            doc,
            project,
            "Relatório de Otimização de Chapas",
            Math.ceil((index * 10 + pieceIndex) / 30) + 1
          );
          currentY = 55;
        }
        doc.text(
          `${piece.tag}: ${piece.width}×${piece.height}mm`,
          25,
          currentY
        );
        currentY += 5;
      });

      currentY += 10;
    });

    this.addFooter(doc, project);
    doc.save(
      `relatorio-chapas-${project.projectNumber}-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  }

  static async generateMaterialReport(materials: any[]): Promise<void> {
    const doc = new jsPDF();
    let currentY = 30;

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Materiais", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 150, 30);

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    currentY = 45;

    // Estatísticas gerais
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Geral", 20, currentY);
    currentY += 10;

    const activeMaterials = materials.filter(
      (m) => m.status === "active"
    ).length;
    const totalUsage = materials.reduce((sum, m) => sum + m.count, 0);
    const totalValue = materials.reduce((sum, m) => sum + (m.price || 0), 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Materiais: ${materials.length}`, 20, currentY);
    doc.text(`Materiais Ativos: ${activeMaterials}`, 20, currentY + 5);
    doc.text(`Total de Usos: ${totalUsage}`, 20, currentY + 10);
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 20, currentY + 15);
    currentY += 25;

    // Lista de materiais
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento dos Materiais", 20, currentY);
    currentY += 10;

    // Cabeçalho da tabela
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Material", 20, currentY);
    doc.text("Status", 80, currentY);
    doc.text("Usos", 110, currentY);
    doc.text("Último Uso", 130, currentY);
    doc.text("Preço/kg", 170, currentY);
    currentY += 5;

    doc.line(20, currentY, 190, currentY);
    currentY += 5;

    // Dados dos materiais
    doc.setFont("helvetica", "normal");
    materials.forEach((material) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 30;
      }

      doc.text(material.name.substring(0, 40), 20, currentY);
      doc.text(
        material.status === "active" ? "Ativo" : "Arquivado",
        80,
        currentY
      );
      doc.text(material.count.toString(), 110, currentY);
      doc.text(material.lastUsed, 130, currentY);
      doc.text(
        material.price ? `R$ ${material.price.toFixed(2)}` : "N/A",
        170,
        currentY
      );
      currentY += 5;
    });

    // Rodapé
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text("© Sistema de Otimização - GMX Industrial", 105, pageHeight - 10, {
      align: "center",
    });

    doc.save(
      `relatorio-materiais-${new Date().toISOString().split("T")[0]}.pdf`
    );
  }

  // ===== MÉTODOS PARA EMENDAS =====

  private static async getEmendasData(
    projectId: string
  ): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from("emendas_otimizacao")
        .select("*")
        .eq("projeto_otimizacao_id", projectId);

      if (error) {
        console.error("Erro ao buscar emendas:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar emendas:", error);
      return null;
    }
  }

  private static async addEmendaPlan(
    doc: jsPDF,
    emendasData: any[],
    currentY: number,
    project: Project,
    pageNumber: number
  ): Promise<number> {
    // Verificar se precisa de nova página
    if (currentY > 200) {
      doc.addPage();
      pageNumber++;
      this.addHeader(
        doc,
        project,
        "Relatório Completo de Otimização Linear",
        pageNumber
      );
      currentY = 55;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("🔗 Plano de Emendas", 20, currentY);
    currentY += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Legenda: 🔗 = Peça com Emenda | ⚠️ = Emenda Obrigatória | ✅ = Aprovada | ⏳ = Pendente",
      20,
      currentY
    );
    currentY += 8;

    // Cabeçalho da tabela de emendas
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TAG/Pos", 20, currentY);
    doc.text("Tipo", 50, currentY);
    doc.text("Segmentos", 70, currentY);
    doc.text("Localização", 120, currentY);
    doc.text("Status QA", 160, currentY);
    doc.text("Obs", 180, currentY);
    currentY += 5;

    doc.line(20, currentY, 195, currentY);
    currentY += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    emendasData.forEach((emenda, index) => {
      if (currentY > 275) {
        doc.addPage();
        pageNumber++;
        this.addHeader(
          doc,
          project,
          "Relatório Completo de Otimização Linear",
          pageNumber
        );
        currentY = 55;
      }

      const tipoIcon = emenda.peca_tag?.includes("OBRIG") ? "⚠️" : "🔗";
      const statusIcon =
        emenda.status_qualidade === "aprovada"
          ? "✅"
          : emenda.status_qualidade === "reprovada"
          ? "❌"
          : "⏳";

      doc.text(
        `${tipoIcon} ${emenda.peca_tag || `E${index + 1}`}`,
        20,
        currentY
      );
      doc.text(
        emenda.peca_tag?.includes("OBRIG") ? "Obrig." : "Opc.",
        50,
        currentY
      );
      doc.text(`${emenda.quantidade_emendas || 1} emenda(s)`, 70, currentY);
      doc.text("Centro", 120, currentY);
      doc.text(
        `${statusIcon} ${emenda.status_qualidade || "Pend."}`,
        160,
        currentY
      );
      doc.text(
        emenda.observacoes ? emenda.observacoes.substring(0, 10) + "..." : "",
        180,
        currentY
      );

      currentY += 5;
    });

    currentY += 10;

    // Instruções de soldagem
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("📋 Instruções de Soldagem", 20, currentY);
    currentY += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const instrucoes = [
      "1. Verificar alinhamento dos segmentos antes da soldagem",
      "2. Preparar chanfro conforme especificação do perfil",
      "3. Aplicar passe de raiz com eletrodo apropriado",
      "4. Executar passes de enchimento e acabamento",
      "5. Inspeção visual e dimensional obrigatória",
      "6. Registrar aprovação do QA antes da liberação",
    ];

    instrucoes.forEach((instrucao) => {
      if (currentY > 275) {
        doc.addPage();
        pageNumber++;
        this.addHeader(
          doc,
          project,
          "Relatório Completo de Otimização Linear",
          pageNumber
        );
        currentY = 55;
      }
      doc.text(instrucao, 20, currentY);
      currentY += 5;
    });

    return currentY + 10;
  }

  static async generateEmendaReport(
    projectId: string,
    project: Project
  ): Promise<void> {
    try {
      const doc = new jsPDF();
      let currentY = 55;
      let pageNumber = 1;

      this.addHeader(
        doc,
        project,
        "Relatório Específico de Emendas",
        pageNumber
      );

      // Buscar dados de emendas
      const emendasData = await this.getEmendasData(projectId);

      if (!emendasData || emendasData.length === 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Nenhuma emenda encontrada para este projeto.", 20, currentY);
        doc.save(
          `relatorio-emendas-${project.projectNumber}-${
            new Date().toISOString().split("T")[0]
          }.pdf`
        );
        return;
      }

      // Resumo de emendas
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("📊 Resumo de Emendas", 20, currentY);
      currentY += 10;

      const totalEmendas = emendasData.length;
      const emendasObrigatorias = emendasData.filter(
        (e) => e.peca_tag?.includes("OBRIG") || false
      ).length;
      const emendasOpcionais = totalEmendas - emendasObrigatorias;
      const emendasAprovadas = emendasData.filter(
        (e) => e.status_qualidade === "aprovada"
      ).length;
      const emendasPendentes = emendasData.filter(
        (e) => e.status_qualidade === "pendente"
      ).length;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Emendas: ${totalEmendas}`, 20, currentY);
      doc.text(`Emendas Obrigatórias: ${emendasObrigatorias}`, 100, currentY);
      doc.text(`Emendas Opcionais: ${emendasOpcionais}`, 20, currentY + 5);
      doc.text(`Status Aprovado: ${emendasAprovadas}`, 100, currentY + 5);
      doc.text(`Status Pendente: ${emendasPendentes}`, 20, currentY + 10);
      currentY += 20;

      // Detalhamento das emendas
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("🔗 Detalhamento das Emendas", 20, currentY);
      currentY += 15;

      emendasData.forEach((emenda, index) => {
        if (currentY > 240) {
          doc.addPage();
          pageNumber++;
          this.addHeader(
            doc,
            project,
            "Relatório Específico de Emendas",
            pageNumber
          );
          currentY = 55;
        }

        // Cabeçalho da emenda
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const tipoIcon = emenda.peca_tag?.includes("OBRIG") ? "⚠️" : "🔗";
        doc.text(
          `${tipoIcon} Emenda ${index + 1} - ${
            emenda.peca_tag || `E${index + 1}`
          }`,
          20,
          currentY
        );
        currentY += 8;

        // Detalhes da emenda
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Tipo: ${
            emenda.peca_tag?.includes("OBRIG") ? "Obrigatória" : "Opcional"
          }`,
          25,
          currentY
        );
        doc.text(`Localização: Centro da peça`, 25, currentY + 5);
        doc.text(
          `Emendas: ${emenda.quantidade_emendas || 1}`,
          25,
          currentY + 10
        );
        doc.text(
          `Comprimento Original: ${emenda.comprimento_original || "N/A"}mm`,
          25,
          currentY + 15
        );

        const statusIcon =
          emenda.status_qualidade === "aprovada"
            ? "✅"
            : emenda.status_qualidade === "reprovada"
            ? "❌"
            : "⏳";
        doc.text(
          `Status QA: ${statusIcon} ${emenda.status_qualidade || "Pendente"}`,
          25,
          currentY + 20
        );

        if (emenda.observacoes) {
          doc.text(`Observações: ${emenda.observacoes}`, 25, currentY + 25);
          currentY += 30;
        } else {
          currentY += 25;
        }

        // Instruções específicas para esta emenda
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("📋 Instruções Específicas:", 25, currentY);
        currentY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const instrucoes = [
          `• Preparar chanfro apropriado para o perfil`,
          `• Verificar alinhamento dos segmentos`,
          `• Executar soldagem conforme procedimento ${
            emenda.peca_tag?.includes("OBRIG") ? "WPS-001" : "WPS-002"
          }`,
          `• Inspeção obrigatória após conclusão`,
        ];

        instrucoes.forEach((instrucao) => {
          doc.text(instrucao, 30, currentY);
          currentY += 4;
        });

        currentY += 10;

        // Seção para assinaturas
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          "Soldador: _________________________ Data: ___/___/___",
          25,
          currentY
        );
        doc.text(
          "QA: _________________________ Data: ___/___/___",
          25,
          currentY + 5
        );

        currentY += 15;
      });

      // Checklist geral de QA
      if (currentY > 200) {
        doc.addPage();
        pageNumber++;
        this.addHeader(
          doc,
          project,
          "Relatório Específico de Emendas",
          pageNumber
        );
        currentY = 55;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("✅ Checklist de Controle de Qualidade", 20, currentY);
      currentY += 15;

      const checklist = [
        "☐ Todas as emendas foram executadas conforme projeto",
        "☐ Alinhamento dimensional verificado",
        "☐ Inspeção visual aprovada",
        "☐ Teste de continuidade realizado (se aplicável)",
        "☐ Documentação fotográfica realizada",
        "☐ Aprovação final do QA",
        "☐ Peças liberadas para montagem",
      ];

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      checklist.forEach((item) => {
        doc.text(item, 20, currentY);
        currentY += 6;
      });

      this.addFooter(doc, project);
      doc.save(
        `relatorio-emendas-${project.projectNumber}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Erro ao gerar relatório de emendas:", error);
      alert(
        "Erro ao gerar relatório de emendas. Verifique os dados e tente novamente."
      );
      throw error;
    }
  }
}
