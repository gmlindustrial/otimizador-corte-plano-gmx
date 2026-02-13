import ExcelJS from 'exceljs';

export interface ParsedXlsxPiece {
  id: string;
  length: number;
  quantity: number;
  posicao: string;
  tag: string;
  fase: string;
  perfil: string;
  material: string;
  peso: number;
}

export class XlsxTemplateService {

  static async downloadTemplate(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Otimizador de Corte';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Peças');

    worksheet.columns = [
      { header: 'Posição',           key: 'posicao',      width: 15 },
      { header: 'Tag',               key: 'tag',          width: 12 },
      { header: 'Fase',              key: 'fase',         width: 10 },
      { header: 'Descrição Perfil',  key: 'descricao',    width: 25 },
      { header: 'Comprimento (mm)',  key: 'comprimento',  width: 20 },
      { header: 'Quantidade',        key: 'quantidade',   width: 14 },
      { header: 'Material',          key: 'material',     width: 18 },
      { header: 'Peso',              key: 'peso',         width: 12 },
    ];

    // Estilo do header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;

    // Linhas de exemplo
    const exampleRows = [
      { posicao: '189', tag: 'CE-17', fase: 'F1', descricao: 'W200X35.9',  comprimento: 10186, quantidade: 1, material: 'A572-50', peso: 365.7 },
      { posicao: '190', tag: 'CE-17', fase: 'F1', descricao: 'L51X4.7',    comprimento: 2500,  quantidade: 4, material: 'A36',     peso: 47.0  },
      { posicao: '191', tag: 'CE-18', fase: 'F2', descricao: 'W310X38.7',  comprimento: 6000,  quantidade: 2, material: 'A572-50', peso: 464.4 },
      { posicao: '192', tag: 'CE-18', fase: 'F2', descricao: 'C75X6.0',    comprimento: 1200,  quantidade: 8, material: 'A36',     peso: 57.6  },
    ];

    exampleRows.forEach(row => {
      const dataRow = worksheet.addRow(row);
      dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Formatação numérica
    worksheet.getColumn('comprimento').numFmt = '#,##0';
    worksheet.getColumn('quantidade').numFmt = '#,##0';
    worksheet.getColumn('peso').numFmt = '#,##0.0';

    // Bordas em todas as células
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
      });
    });

    // Auto-filtro e congelar header
    worksheet.autoFilter = { from: 'A1', to: 'H1' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo-importacao-pecas.xlsx';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async parseXlsx(file: File): Promise<ParsedXlsxPiece[]> {
    console.log(`📁 Parsing arquivo: ${file.name}`);

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    // Tentar encontrar a planilha de várias formas
    let worksheet = workbook.getWorksheet(1);

    // Se não encontrou pelo índice 1, tentar outras abordagens
    if (!worksheet) {
      console.log('⚠️ Planilha não encontrada pelo índice 1, tentando outras abordagens...');

      // Listar todas as planilhas disponíveis e usar a primeira
      workbook.eachSheet((sheet) => {
        if (!worksheet) {
          worksheet = sheet;
          console.log(`📋 Usando planilha: "${sheet.name}"`);
        }
      });
    }

    if (!worksheet) {
      throw new Error('A planilha está vazia ou não foi encontrada');
    }

    console.log(`📋 Planilha: "${worksheet.name}" (${worksheet.rowCount} linhas)`);

    const pieces: ParsedXlsxPiece[] = [];

    // Mapear colunas pelo header
    const headerRow = worksheet.getRow(1);
    const columnMap = XlsxTemplateService.buildColumnMap(headerRow);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const posicao = XlsxTemplateService.getCellValue(row, columnMap.posicao);
      const tag = XlsxTemplateService.getCellValue(row, columnMap.tag);
      const fase = XlsxTemplateService.getCellValue(row, columnMap.fase);
      const descricao = XlsxTemplateService.getCellValue(row, columnMap.descricao);
      const comprimentoRaw = XlsxTemplateService.getCellValue(row, columnMap.comprimento);
      const quantidadeRaw = XlsxTemplateService.getCellValue(row, columnMap.quantidade);
      const material = XlsxTemplateService.getCellValue(row, columnMap.material);
      const pesoRaw = XlsxTemplateService.getCellValue(row, columnMap.peso);

      const comprimento = parseFloat(String(comprimentoRaw ?? '').replace(',', '.')) || 0;
      const quantidadeParsed = parseInt(String(quantidadeRaw ?? ''));
      const quantidade = isNaN(quantidadeParsed) || quantidadeParsed <= 0 ? 1 : quantidadeParsed;
      const peso = parseFloat(String(pesoRaw ?? '').replace(',', '.')) || 0;

      // Pular linhas completamente vazias
      if (!posicao && !tag && comprimento <= 0) return;

      // Validar comprimento obrigatório
      if (comprimento <= 0) {
        console.warn(`⚠️ Linha ${rowNumber}: comprimento inválido (${comprimentoRaw}), peça ignorada`);
        return;
      }

      // Validar range do comprimento
      if (comprimento < 100 || comprimento > 50000) {
        console.warn(`⚠️ Linha ${rowNumber}: comprimento ${comprimento}mm fora do range (100-50000mm), peça ignorada`);
        return;
      }

      pieces.push({
        id: `xlsx-${Date.now()}-${rowNumber}`,
        length: comprimento,
        quantity: quantidade,
        posicao: String(posicao ?? ''),
        tag: String(tag ?? ''),
        fase: String(fase ?? ''),
        perfil: String(descricao ?? ''),
        material: String(material ?? ''),
        peso,
      });
    });

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça encontrada na planilha. Verifique se o formato está correto.');
    }

    return pieces;
  }

  private static buildColumnMap(headerRow: ExcelJS.Row): Record<string, number> {
    const map: Record<string, number> = {
      posicao: 1,
      tag: 2,
      fase: 3,
      descricao: 4,
      comprimento: 5,
      quantidade: 6,
      material: 7,
      peso: 8,
    };

    headerRow.eachCell((cell, colNumber) => {
      const value = String(cell.value ?? '').toLowerCase().trim();

      if (value.includes('posi') || value === 'posicao' || value === 'posição') {
        map.posicao = colNumber;
      } else if (value === 'tag') {
        map.tag = colNumber;
      } else if (value === 'fase') {
        map.fase = colNumber;
      } else if (value.includes('descri') || value.includes('perfil')) {
        map.descricao = colNumber;
      } else if (value.includes('comprimento') || value.includes('length')) {
        map.comprimento = colNumber;
      } else if (value.includes('quant') || value === 'qt.' || value === 'qt') {
        map.quantidade = colNumber;
      } else if (value.includes('material')) {
        map.material = colNumber;
      } else if (value.includes('peso') || value.includes('weight')) {
        map.peso = colNumber;
      }
    });

    return map;
  }

  private static getCellValue(row: ExcelJS.Row, colNumber: number): string | number | null {
    const cell = row.getCell(colNumber);
    if (!cell || cell.value === null || cell.value === undefined) return null;

    if (typeof cell.value === 'object' && cell.value !== null) {
      if ('result' in cell.value) return cell.value.result as string | number;
      if ('richText' in (cell.value as any)) {
        return ((cell.value as any).richText as Array<{ text: string }>).map(t => t.text).join('');
      }
      return String(cell.value);
    }

    return cell.value as string | number;
  }
}
