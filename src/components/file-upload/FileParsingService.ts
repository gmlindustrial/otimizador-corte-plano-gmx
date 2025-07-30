import { CutPiece } from '@/pages/Index';

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
    
    if (!descricao) return 0;
    
    // Encontrar posições dos X's
    const xPositions: number[] = [];
    for (let i = 0; i < descricao.length; i++) {
      if (descricao[i].toUpperCase() === 'X') {
        xPositions.push(i);
      }
    }
    
    let comprimento = 0;
    if (xPositions.length >= 2) {
      // Extrair tudo após o segundo X
      const afterSecondX = descricao.substring(xPositions[1] + 1);
      const lengthMatch = afterSecondX.match(/(\d+)/);
      if (lengthMatch) {
        comprimento = parseInt(lengthMatch[1]);
      }
    } else {
      // Fallback: buscar qualquer número grande na string
      const lengthMatch = descricao.match(/(\d{3,})/);
      if (lengthMatch) {
        comprimento = parseInt(lengthMatch[1]);
      }
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
    // Simulação de parsing Excel - em produção usaria biblioteca como xlsx
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Implementação simplificada - assumindo formato CSV-like
        const content = e.target?.result as string;
        resolve(this.parseCSV(content));
      };
      reader.readAsText(file);
    });
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
}