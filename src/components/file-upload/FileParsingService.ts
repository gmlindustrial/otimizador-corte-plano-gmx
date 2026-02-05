import { CutPiece } from '@/pages/Index';

// Tipo para peças de chapa importadas do Inventor
export interface SheetInventorPiece {
  id: string;
  tag: string;           // Item número
  posicao: string;       // Projeto Número
  width: number;         // Largura em mm
  height: number;        // Altura/comprimento em mm
  thickness?: number;    // Espessura (se disponível)
  quantity: number;
  material: string;
  descricao: string;     // Descrição original (ex: "Chapa 6,4")
  fase?: string;
  peso?: number;
}

// Resultado do parse do Inventor com separação de tipos
export interface InventorParseResult {
  linearPieces: CutPiece[];        // Peças para corte linear (1D)
  sheetPieces: SheetInventorPiece[]; // Peças para corte 2D
  stats: {
    total: number;
    linear: number;
    sheet: number;
    ignored: number;
    details: {
      soldado: number;
      din: number;
      semDimensao: number;
      classeLote: number;
      comprimentoInvalido: number;
    };
  };
}

export class FileParsingService {
  static parseCSV(content: string): CutPiece[] {
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: CutPiece[] = [];
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('comprimento') || lines[0].toLowerCase().includes('length') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      if (cols.length >= 2) {
        const length = parseFloat(cols[0]);
        const quantity = parseInt(cols[1]) || 1;
        
        if (!isNaN(length) && length > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            length,
            quantity
          });
        }
      }
    }
    return pieces;
  }

  static parseAutoCADReport(content: string): CutPiece[] {
    console.log('🔄 Iniciando parsing de arquivo AutoCAD...');
    console.log('📄 Primeiras 10 linhas:', content.split('\n').slice(0, 10));
    
    const lines = content.split('\n');
    let pieces: CutPiece[] = [];
    
    console.log(`📊 Total de linhas no arquivo: ${lines.length}`);
    
    // Verificar se é arquivo AutoCAD válido (incluindo novo formato)
    const isAutoCADFile = lines.some(line => 
      line.includes('LM por Conjunto') || 
      line.includes('METALMAX') ||
      line.includes('OBRA:') ||
      line.includes('HANGAR') ||
      line.includes('TERMINAL') ||
      line.includes('MARCA') ||
      line.includes('ITEM') ||
      line.includes('CONJUNTO') ||  // Novo formato
      line.includes('TAG') ||       // Novo formato
      line.includes('DESCRIÇÃO') ||
      line.match(/[A-Z]+\.?\d+/) // Padrões: V.172, V.173, C34, etc.
    );
    
    console.log('✅ Arquivo identificado como AutoCAD:', isAutoCADFile);
    
    if (!isAutoCADFile) {
      throw new Error('Arquivo não parece ser um relatório AutoCAD válido');
    }

    // Usar APENAS formato simplificado
    console.log('🎯 Usando APENAS formato tabular simplificado...');
    pieces = this.parseSimplifiedTabularFormat(lines);

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça foi encontrada no arquivo AutoCAD');
    }

    console.log(`✅ Total de peças extraídas: ${pieces.length}`);
    const obra = (pieces[0] as any)?.obra || 'Não identificada';
    console.log(`🏗️ Obra: ${obra}`);
    console.log('📦 Tags encontrados:', [...new Set(pieces.map(p => (p as any).tag))]);
    
    return pieces;
  }

  // Detectar formato tabular simplificado (MARCA, ITEM, QT., DESCRIÇÃO...)
  private static detectTabularFormat(lines: string[]): boolean {
    console.log('🔍 Detectando formato tabular simplificado...');
    
    // Procurar por cabeçalhos específicos do formato simplificado
    const simplifiedHeaders = lines.some(line => {
      const upperLine = line.toUpperCase();
      return upperLine.includes('MARCA') &&
             upperLine.includes('ITEM') &&
             upperLine.includes('QT.') &&
             upperLine.includes('DESCRIÇÃO');
    });
    
    console.log(`✅ Formato tabular simplificado detectado: ${simplifiedHeaders}`);
    return simplifiedHeaders;
  }

  // Remover detecção do formato pontilhado - usando apenas formato simplificado
  private static detectDottedFormat(lines: string[]): boolean {
    console.log('🔍 Formato pontilhado desabilitado - usando apenas formato simplificado');
    return false;
  }

  // Parser para formato tabular - usando APENAS formato simplificado
  private static parseTabularFormat(lines: string[]): CutPiece[] {
    console.log('🎯 Usando APENAS parser formato tabular simplificado...');
    return this.parseSimplifiedTabularFormat(lines);
  }

  // Parser específico para formato tabular simplificado (MARCA, ITEM, QT., DESCRIÇÃO...)
  private static parseSimplifiedTabularFormat(lines: string[]): CutPiece[] {
    console.log('🎯 Iniciando parse formato tabular simplificado...');
    const pieces: CutPiece[] = [];
    let obra = '';
    let headerIndex = -1;
    
    // Extrair obra
    for (const line of lines) {
      const obraMatch = line.match(/OBRA:\s*(.+?)(?:\s+Data:|$)/i);
      if (obraMatch) {
        obra = obraMatch[1].trim();
        console.log('🏗️ Obra identificada:', obra);
        break;
      }
    }
    
   // Encontrar linha de cabeçalho (detectar ambos os formatos)
    let isNewFormat = false;
    for (let i = 0; i < lines.length; i++) {
      const upperLine = lines[i].toUpperCase();
      
      // Novo formato: CONJUNTO;TAG;QT.;DESCRIÇÃO PERFIL;MATERIAL;PESO
      if (upperLine.includes('CONJUNTO') && upperLine.includes('TAG') && upperLine.includes('QT') && 
          (upperLine.includes('DESCRI') || upperLine.includes('DESCRIÇÃO'))) {
        headerIndex = i;
        isNewFormat = true;
        console.log(`📋 NOVO FORMATO detectado na linha ${i}: "${lines[i]}"`);
        break;
      }
      // Formato antigo: MARCA, ITEM, QT e pelo menos parte de DESCRIÇÃO
      else if (upperLine.includes('MARCA') && upperLine.includes('ITEM') && 
               upperLine.includes('QT') && (upperLine.includes('DESCRI') || upperLine.includes('DESCRIÇÃO'))) {
        headerIndex = i;
        isNewFormat = false;
        console.log(`📋 FORMATO ANTIGO detectado na linha ${i}: "${lines[i]}"`);
        break;
      }
    }
    
    if (headerIndex === -1) {
      throw new Error('Cabeçalho do formato simplificado não encontrado');
    }
    
    // Processar dados a partir da linha após o cabeçalho
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Pular linhas vazias ou separadores
      if (!line || line.match(/^[\-\=\s]+$/)) {
        continue;
      }
      
      // Regex para capturar dados separados por ponto e vírgula (;)
      // Exemplo: "CE-17;189;1;W200X35.9X10186;A572-50;365.7"
      const simplifiedMatch = line.split(';').map(item => item.trim());
      
      if (simplifiedMatch && simplifiedMatch.length >= 4) {
        let tag = '';
        let posicao = '';
        let fase = '';
        const quantidade = simplifiedMatch[2];
        const descricao = simplifiedMatch[3];
        const material = simplifiedMatch[4] || 'MATERIAL';
        const peso = simplifiedMatch[5] || '0';
        
        // Verificar se há campo FASE (posição 6)
        if (simplifiedMatch.length >= 7) {
          fase = simplifiedMatch[6]; // FASE
        }
        
        if (isNewFormat) {
          // Novo formato: CONJUNTO;TAG;QT.;DESCRIÇÃO PERFIL;MATERIAL;PESO;FASE
          const conjunto = simplifiedMatch[0]; // CONJUNTO → tag
          const tagField = simplifiedMatch[1];  // TAG → posição
          tag = conjunto;
          posicao = tagField;
          console.log(`📋 Novo formato - CONJUNTO: "${conjunto}" → tag, TAG: "${tagField}" → posição, FASE: "${fase}"`);
        } else {
          // Formato antigo: MARCA;ITEM;QT.;DESCRIÇÃO;MATERIAL;PESO
          const marca = simplifiedMatch[0];
          const item = simplifiedMatch[1];
          tag = marca;      // MARCA → tag
          posicao = item;   // ITEM → posição
          console.log(`📋 Formato antigo - MARCA: "${marca}" → tag, ITEM: "${item}" → posição`);
        }
        
        // Extrair perfil da descrição (somente até o segundo X)
        const perfil = this.extractPerfilFromDescription(descricao);
        
        // Extrair comprimento da descrição (após o segundo X)
        const comprimento = this.extractLengthFromDescription(descricao);
        
        // Converter quantidade corretamente
        const quantidadeNum = parseInt(quantidade.replace(/[^\d]/g, '')) || 1;
        
        const tagCompleta = `${tag}-${posicao}`;
        const piece: any = {
          id: `autocad-simp-${tag}-${posicao}-${Date.now()}`,
          length: comprimento,
          quantity: quantidadeNum, // Garantir que quantidade seja processada corretamente
          obra,
          tag: tag,       // Mapeamento correto conforme formato
          posicao: posicao, // Mapeamento correto conforme formato
          fase: fase, // Campo FASE
          perfil,
          material: material,
          peso: peso ? parseFloat(peso.replace(',', '.')) : 0,
          tagCompleta,
          dimensoes: {
            comprimento,
            largura: 0
          }
        };
        
        pieces.push(piece);
        console.log(`✅ Peça processada (${isNewFormat ? 'NOVO' : 'ANTIGO'}): ${tagCompleta} - ${piece.length}mm - Qtd: ${piece.quantity}`);
        console.log(`   tag: "${piece.tag}", posição: "${piece.posicao}"`);
        console.log(`   DESCRIÇÃO: "${descricao}" -> perfil: "${piece.perfil}" (${comprimento}mm)`);
        console.log(`   ---`);
      } else {
        // Log para debug
        if (line.length > 5 && line.match(/\d/)) {
          console.log(`❓ Linha não reconhecida no formato simplificado: "${line}"`);
        }
      }
    }
    
    return pieces;
  }
  
  // Extrair perfil da descrição (somente até o segundo X)
  private static extractPerfilFromDescription(descricao: string): string {
    console.log(`🔧 Extraindo perfil de: "${descricao}"`);
    
    if (!descricao) return 'PERFIL';
    
    // Encontrar posições dos X's
    const xPositions: number[] = [];
    for (let i = 0; i < descricao.length; i++) {
      if (descricao[i].toUpperCase() === 'X') {
        xPositions.push(i);
      }
    }
    
    let perfil: string;
    if (xPositions.length >= 2) {
      // Extrair até o segundo X (SEM incluir o segundo X)
      perfil = descricao.substring(0, xPositions[1]);
    } else if (xPositions.length === 1) {
      // Se só há um X, extrair até ele
      perfil = descricao.substring(0, xPositions[0] + 1);
    } else {
      // Se não há X, usar a descrição toda
      perfil = descricao;
    }
    
    perfil = perfil.trim().toUpperCase();
    console.log(`🔧 Perfil extraído: "${perfil}"`);
    return perfil;
  }
  
  // Extrair comprimento da descrição (após o segundo X)
  private static extractLengthFromDescription(descricao: string): number {
    console.log(`🔧 Extraindo comprimento de: "${descricao}"`);
    
    if (!descricao) {
      console.log(`❌ Descrição vazia`);
      return 0;
    }
    
    // Encontrar posições dos X's
    const xPositions: number[] = [];
    for (let i = 0; i < descricao.length; i++) {
      if (descricao[i].toUpperCase() === 'X') {
        xPositions.push(i);
      }
    }
    
    let comprimento = 0;
    
    // Primeiro: tentar extrair após o segundo X
    if (xPositions.length >= 2) {
      const afterSecondX = descricao.substring(xPositions[1] + 1);
      const lengthMatch = afterSecondX.match(/(\d+)/);
      if (lengthMatch) {
        comprimento = parseInt(lengthMatch[1]);
      }
    }
    
    // Fallback 1: buscar qualquer número de 4+ dígitos
    if (comprimento === 0) {
      const lengthMatch = descricao.match(/(\d{4,})/);
      if (lengthMatch) {
        comprimento = parseInt(lengthMatch[1]);
      }
    }
    
    // Fallback 2: buscar qualquer número de 3+ dígitos
    if (comprimento === 0) {
      const lengthMatch = descricao.match(/(\d{3,})/);
      if (lengthMatch) {
        comprimento = parseInt(lengthMatch[1]);
      }
    }
    
    // Validar se o comprimento faz sentido (entre 100mm e 50000mm)
    if (comprimento > 0 && (comprimento < 100 || comprimento > 50000)) {
      console.log(`⚠️ Comprimento fora do range válido: ${comprimento}mm`);
      comprimento = 0;
    }
    
    console.log(`🔧 Comprimento extraído: ${comprimento}mm`);
    return comprimento;
  }

  // Método para normalizar descrições de perfis
  static normalizePerfil(perfil: string): string {
    if (!perfil || perfil === 'PERFIL') {
      return 'PERFIL';
    }
    
    return perfil
      .replace(/\s+/g, '') // Remove todos os espaços
      .replace(/X/gi, 'X') // Padroniza o X
      .replace(/x/g, 'X')
      .toUpperCase()
      .replace(/([A-Z])(\d)/g, '$1$2'); // Garante formato correto L51X4.7
  }

  // Parser para formato pontilhado (desabilitado)
  private static parseDottedFormat(lines: string[]): CutPiece[] {
    console.log('🔸 Parser pontilhado desabilitado - usando apenas formato simplificado');
    return [];
  }

  static async parseExcel(file: File): Promise<CutPiece[]> {
    const { XlsxTemplateService } = await import('@/services/XlsxTemplateService');
    const parsed = await XlsxTemplateService.parseXlsx(file);

    return parsed.map((p) => ({
      id: p.id,
      length: p.length,
      quantity: p.quantity,
      posicao: p.posicao,
      tag: p.tag,
      fase: p.fase,
      perfil: p.perfil,
      material: p.material,
      peso: p.peso,
    }));
  }

  static parseTXT(content: string): CutPiece[] {
    // Verificar se é arquivo AutoCAD primeiro (incluindo novo formato)
    if (content.includes('LM por Conjunto') || content.includes('OBRA:') || content.includes('MARCA') || content.includes('ITEM') || content.includes('CONJUNTO') || content.includes('TAG') || content.includes('DESCRIÇÃO') || content.includes('METALMAX')) {
      return this.parseAutoCADReport(content);
    }
    
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: CutPiece[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Formato: "comprimento quantidade" ou "comprimento,quantidade" ou "comprimento;quantidade"
      const match = line.match(/(\d+(?:\.\d+)?)[,;\s]+(\d+)/);
      if (match) {
        const length = parseFloat(match[1]);
        const quantity = parseInt(match[2]);
        
        if (!isNaN(length) && !isNaN(quantity) && length > 0 && quantity > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            length,
            quantity
          });
        }
      }
    }
    return pieces;
  }

  static async parsePDF(file: File): Promise<CutPiece[]> {
    // Simulação de extração de PDF - em produção usaria biblioteca como pdf-parse
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dados simulados extraídos do PDF
        const mockData: CutPiece[] = [
          { id: `pdf-${Date.now()}-1`, length: 2500, quantity: 5 },
          { id: `pdf-${Date.now()}-2`, length: 1800, quantity: 3 },
          { id: `pdf-${Date.now()}-3`, length: 3200, quantity: 2 }
        ];
        resolve(mockData);
      }, 1500);
    });
  }

  // Parser para arquivos do Autodesk Inventor (formato tabela markdown)
  // Retorna APENAS peças lineares para manter compatibilidade com código existente
  static parseInventorReport(content: string): CutPiece[] {
    const result = this.parseInventorReportFull(content);
    return result.linearPieces;
  }

  // Parser completo que retorna tanto peças lineares quanto chapas
  static parseInventorReportFull(content: string): InventorParseResult {
    console.log('🔄 Iniciando parsing completo de arquivo Inventor...');

    const lines = content.split('\n');
    const linearPieces: CutPiece[] = [];
    const sheetPieces: SheetInventorPiece[] = [];
    let currentProject = '';
    let currentModule = '';
    let skippedItems = {
      soldado: 0,
      din: 0,
      semDimensao: 0,
      classeLote: 0,
      comprimentoInvalido: 0
    };

    for (const line of lines) {
      // Extrair metadados do projeto
      const projetoMatch = line.match(/^Projeto:\s*(.+)/);
      if (projetoMatch) {
        currentProject = projetoMatch[1].trim();
        continue;
      }

      const moduloMatch = line.match(/^Módulo:\s*(.+)/);
      if (moduloMatch) {
        currentModule = moduloMatch[1].trim();
        continue;
      }

      // Ignorar linhas que não são dados de tabela
      if (!line.includes('|')) continue;
      if (line.includes('----')) continue;
      if (line.includes('Item | Módulo') || line.includes('| Item |')) continue;

      // Parse da linha de dados (formato markdown table)
      const cols = line.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length < 8) continue;

      const [item, modulo, projetoNum, area, qtde, descricao, material, dimensao, pesoUnit, pesoTotal, obs] = cols;

      // Validar se é uma linha de dados válida (item deve ser número)
      if (!item || !/^\d+$/.test(item.trim())) continue;

      // Filtros de exclusão
      if (material?.toUpperCase() === 'SOLDADO') {
        console.log(`⏭️ Ignorando SOLDADO: ${descricao}`);
        skippedItems.soldado++;
        continue;
      }
      if (descricao?.includes('DIN')) {
        console.log(`⏭️ Ignorando parafuso/arruela DIN: ${descricao}`);
        skippedItems.din++;
        continue;
      }
      if (dimensao === '—' || !dimensao || dimensao.trim() === '') {
        console.log(`⏭️ Ignorando sem dimensão: ${descricao}`);
        skippedItems.semDimensao++;
        continue;
      }
      if (material?.includes('C.L')) {
        console.log(`⏭️ Ignorando C.L (parafuso): ${descricao}`);
        skippedItems.classeLote++;
        continue;
      }

      // Analisar dimensões para determinar tipo de peça
      const dimensaoTrimmed = dimensao.trim();
      // Normalizar separadores: × (multiplicação) e x (letra) para o mesmo separador
      const dimensaoNormalizada = dimensaoTrimmed.replace(/[×x]/gi, '×');
      const partes = dimensaoNormalizada.split('×').map(p => parseFloat(p.replace(',', '.').trim()));
      const descricaoLower = (descricao || '').toLowerCase();

      console.log(`🔍 Analisando peça: ${descricao} | Dimensão original: "${dimensaoTrimmed}" | Normalizada: "${dimensaoNormalizada}" | Partes: ${partes.length} [${partes.join(', ')}]`);

      // Lógica de classificação:
      // 1 valor = perfil linear (barra)
      // 2 valores = chapa (largura × altura)
      // 3 valores = depende da descrição:
      //   - Se contém "chapa" = chapa (espessura × largura × comprimento)
      //   - Senão = barra (usar maior valor como comprimento)

      if (partes.length === 1) {
        // 1 valor = perfil linear
        const comprimento = partes[0];

        // Validar comprimento
        if (isNaN(comprimento) || comprimento < 100 || comprimento > 50000) {
          console.log(`⏭️ Comprimento inválido: ${comprimento}mm para ${descricao}`);
          skippedItems.comprimentoInvalido++;
          continue;
        }

        // Normalizar descrição do perfil
        const perfilNormalizado = this.normalizeInventorPerfil(descricao || '');

        const piece: CutPiece = {
          id: `inventor-${item}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          length: comprimento,
          quantity: parseInt(qtde) || 1,
          posicao: projetoNum || '',
          tag: item,
          fase: currentModule,
          perfil: perfilNormalizado,
          material: material || '',
          peso: parseFloat(pesoUnit?.replace(',', '.')) || 0,
        };

        linearPieces.push(piece);
        console.log(`✅ Peça LINEAR: ${descricao} - ${comprimento}mm - Qtd: ${piece.quantity}`);

      } else if (partes.length === 2) {
        // 2 valores = chapa (largura × altura)
        const [width, height] = partes;

        // Validar dimensões
        if (isNaN(width) || isNaN(height) || width < 10 || height < 10) {
          console.log(`⏭️ Dimensões inválidas: ${width}×${height}mm para ${descricao}`);
          skippedItems.comprimentoInvalido++;
          continue;
        }

        // Extrair espessura da descrição quando não vem nas dimensões
        // Exemplos: "Chapa 6,4" → 6.4, "Chapa 12,7" → 12.7
        let thickness: number | undefined;
        const thicknessMatch = descricaoLower.match(/chapa\s+(\d+[,.]?\d*)/i);
        if (thicknessMatch) {
          thickness = parseFloat(thicknessMatch[1].replace(',', '.'));
          console.log(`📏 Espessura extraída da descrição "${descricao}": ${thickness}mm`);
        }

        const sheetPiece: SheetInventorPiece = {
          id: `inventor-sheet-${item}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tag: item,
          posicao: projetoNum || '',
          width,
          height,
          thickness,
          quantity: parseInt(qtde) || 1,
          material: material || '',
          descricao: descricao || '',
          fase: currentModule,
          peso: parseFloat(pesoUnit?.replace(',', '.')) || 0,
        };

        sheetPieces.push(sheetPiece);
        console.log(`✅ Peça CHAPA (2D): ${descricao} - ${width}×${height}mm${thickness ? ` esp:${thickness}mm` : ''} - Qtd: ${sheetPiece.quantity}`);

      } else if (partes.length === 3) {
        // 3 valores - verificar se é chapa ou barra
        const [v1, v2, v3] = partes;

        if (descricaoLower.includes('chapa')) {
          // É chapa: espessura × largura × comprimento
          const thickness = v1;
          const width = v2;
          const height = v3;

          // Validar dimensões
          if (isNaN(width) || isNaN(height) || width < 10 || height < 10) {
            console.log(`⏭️ Dimensões inválidas: ${width}×${height}mm para ${descricao}`);
            skippedItems.comprimentoInvalido++;
            continue;
          }

          const sheetPiece: SheetInventorPiece = {
            id: `inventor-sheet-${item}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tag: item,
            posicao: projetoNum || '',
            width,
            height,
            thickness,
            quantity: parseInt(qtde) || 1,
            material: material || '',
            descricao: descricao || '',
            fase: currentModule,
            peso: parseFloat(pesoUnit?.replace(',', '.')) || 0,
          };

          sheetPieces.push(sheetPiece);
          console.log(`✅ Peça CHAPA (3D): ${descricao} - esp:${thickness} ${width}×${height}mm - Qtd: ${sheetPiece.quantity}`);

        } else {
          // É barra: usar maior dimensão como comprimento
          const comprimento = Math.max(v1, v2, v3);

          // Validar comprimento
          if (isNaN(comprimento) || comprimento < 100 || comprimento > 50000) {
            console.log(`⏭️ Comprimento inválido: ${comprimento}mm para ${descricao}`);
            skippedItems.comprimentoInvalido++;
            continue;
          }

          // Normalizar descrição do perfil
          const perfilNormalizado = this.normalizeInventorPerfil(descricao || '');

          const piece: CutPiece = {
            id: `inventor-${item}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            length: comprimento,
            quantity: parseInt(qtde) || 1,
            posicao: projetoNum || '',
            tag: item,
            fase: currentModule,
            perfil: perfilNormalizado,
            material: material || '',
            peso: parseFloat(pesoUnit?.replace(',', '.')) || 0,
          };

          linearPieces.push(piece);
          console.log(`✅ Peça BARRA (3D→linear): ${descricao} - ${comprimento}mm (maior de ${v1}×${v2}×${v3}) - Qtd: ${piece.quantity}`);
        }
      }
    }

    const totalIgnored = skippedItems.soldado + skippedItems.din + skippedItems.semDimensao +
                         skippedItems.classeLote + skippedItems.comprimentoInvalido;

    console.log(`📊 Resumo da importação Inventor:`);
    console.log(`   ✅ Peças LINEARES: ${linearPieces.length}`);
    console.log(`   ✅ Peças CHAPAS: ${sheetPieces.length}`);
    console.log(`   ⏭️ Ignorados (SOLDADO): ${skippedItems.soldado}`);
    console.log(`   ⏭️ Ignorados (DIN): ${skippedItems.din}`);
    console.log(`   ⏭️ Ignorados (sem dimensão): ${skippedItems.semDimensao}`);
    console.log(`   ⏭️ Ignorados (C.L): ${skippedItems.classeLote}`);
    console.log(`   ⏭️ Ignorados (dimensões inválidas): ${skippedItems.comprimentoInvalido}`);

    if (linearPieces.length === 0 && sheetPieces.length === 0) {
      throw new Error('Nenhuma peça válida foi encontrada no arquivo Inventor. Verifique se o arquivo contém peças com dimensões válidas.');
    }

    return {
      linearPieces,
      sheetPieces,
      stats: {
        total: linearPieces.length + sheetPieces.length,
        linear: linearPieces.length,
        sheet: sheetPieces.length,
        ignored: totalIgnored,
        details: skippedItems
      }
    };
  }

  // Método para detectar se é arquivo Inventor
  static isInventorFile(content: string): boolean {
    return content.includes('Dimensão / Modelo') &&
           content.includes('Peso Unit.') &&
           content.includes('| Item |');
  }

  // Normalizar descrição de perfil do Inventor (padronizar x/× e espaços)
  private static normalizeInventorPerfil(perfil: string): string {
    if (!perfil) return '';

    return perfil
      .replace(/\s*[×x]\s*/gi, 'x')  // Padroniza × e x (com ou sem espaços) para "x"
      .replace(/\s+/g, ' ')           // Remove espaços múltiplos
      .trim();
  }
}