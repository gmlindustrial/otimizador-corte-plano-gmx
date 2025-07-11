
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
    
    // Verificar se é arquivo AutoCAD válido
    const isAutoCADFile = lines.some(line => 
      line.includes('LM por Conjunto') || 
      line.includes('METALMAX') ||
      line.includes('OBRA:') ||
      line.includes('HANGAR') ||
      line.includes('TERMINAL') ||
      line.includes('V.') || // Específico para V.172, V.173
      line.match(/[A-Z]+\.?\d+/) // Padrões: V.172, V.173, C34, etc.
    );
    
    console.log('✅ Arquivo identificado como AutoCAD:', isAutoCADFile);
    
    if (!isAutoCADFile) {
      throw new Error('Arquivo não parece ser um relatório AutoCAD válido');
    }

    // Detectar formato do arquivo
    const hasTabularFormat = this.detectTabularFormat(lines);
    const hasDottedFormat = this.detectDottedFormat(lines);
    
    console.log(`📊 Formato detectado - Tabular: ${hasTabularFormat}, Pontilhado: ${hasDottedFormat}`);
    
    // Tentar parse com formato mais provável primeiro
    try {
      if (hasTabularFormat) {
        console.log('🎯 Tentando parser formato tabular...');
        pieces = this.parseTabularFormat(lines);
      } else if (hasDottedFormat) {
        console.log('🎯 Tentando parser formato pontilhado...');
        pieces = this.parseDottedFormat(lines);
      } else {
        // Fallback: tentar ambos os formatos
        console.log('⚠️ Formato não identificado claramente, tentando fallback...');
        try {
          pieces = this.parseTabularFormat(lines);
        } catch (error) {
          console.log('❌ Formato tabular falhou, tentando pontilhado...');
          pieces = this.parseDottedFormat(lines);
        }
      }
    } catch (error) {
      console.error('❌ Erro no parser principal:', error);
      // Última tentativa com o outro formato
      try {
        if (hasTabularFormat) {
          console.log('🔄 Fallback para formato pontilhado...');
          pieces = this.parseDottedFormat(lines);
        } else {
          console.log('🔄 Fallback para formato tabular...');
          pieces = this.parseTabularFormat(lines);
        }
      } catch (fallbackError) {
        console.error('❌ Todos os parsers falharam:', fallbackError);
        throw new Error(`Não foi possível processar o arquivo. Formatos detectados: Tabular=${hasTabularFormat}, Pontilhado=${hasDottedFormat}`);
      }
    }

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça foi encontrada no arquivo AutoCAD');
    }

    console.log(`✅ Total de peças extraídas: ${pieces.length}`);
    const obra = (pieces[0] as any)?.obra || 'Não identificada';
    console.log(`🏗️ Obra: ${obra}`);
    console.log('📦 Conjuntos encontrados:', [...new Set(pieces.map(p => (p as any).conjunto))]);
    
    return pieces;
  }

  // Detectar formato tabular (colunas organizadas)
  private static detectTabularFormat(lines: string[]): boolean {
    console.log('🔍 Detectando formato tabular...');
    
    // Procurar por cabeçalhos típicos do formato tabular
    const tableHeaders = lines.some(line => {
      const upperLine = line.toUpperCase();
      return upperLine.includes('POSIÇÃO') ||
             upperLine.includes('QUANTIDADE') ||
             upperLine.includes('PERFIL') ||
             upperLine.includes('MATERIAL') ||
             upperLine.includes('COMPRIMENTO') ||
             (upperLine.includes('POS') && upperLine.includes('QTD'));
    });
    console.log('📋 Headers encontrados:', tableHeaders);

    // Verificar se há linhas com estrutura tabular consistente (formato da imagem)
    const tabularLines = lines.filter(line => {
      const trimmed = line.trim();
      // Formato típico: Pos Qty Perfil Material Comp Peso (formato mais flexível)
      return trimmed.match(/^\s*\d+\s+\d+\s+\S+.*\d+\s+[\d,\.]+\s*$/);
    });
    console.log(`📊 Linhas tabulares encontradas: ${tabularLines.length}`);
    
    // Verificar se há conjuntos isolados (V.172, V.173)
    const conjuntoLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.match(/^[A-Z]+\.\d+\s*$/i);
    });
    console.log(`📦 Linhas de conjunto encontradas: ${conjuntoLines.length}`);

    const isTabular = tableHeaders || tabularLines.length >= 3 || conjuntoLines.length >= 2;
    console.log(`✅ Formato tabular detectado: ${isTabular}`);
    return isTabular;
  }

  // Detectar formato pontilhado (separado por linhas)
  private static detectDottedFormat(lines: string[]): boolean {
    console.log('🔍 Detectando formato pontilhado...');
    
    const dottedLines = lines.filter(line => line.match(/^-{5,}$/)).length;
    const conjuntoLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.match(/^[A-Z]+\.?-?\d+$/i) && !trimmed.startsWith('P');
    }).length;
    
    console.log(`🔸 Linhas pontilhadas: ${dottedLines}, Conjuntos: ${conjuntoLines}`);
    
    const isDotted = dottedLines >= 2 || conjuntoLines >= 2;
    console.log(`✅ Formato pontilhado detectado: ${isDotted}`);
    return isDotted;
  }

  // Parser para formato tabular
  private static parseTabularFormat(lines: string[]): CutPiece[] {
    console.log('📊 Iniciando parse formato tabular...');
    const pieces: CutPiece[] = [];
    let obra = '';
    let currentConjunto = '';
    let currentPage = 1;
    
    // Extrair obra
    for (const line of lines) {
      const obraMatch = line.match(/OBRA:\s*(.+?)(?:\s+Data:|$)/i);
      if (obraMatch) {
        obra = obraMatch[1].trim();
        console.log('🏗️ Obra identificada:', obra);
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar conjunto (linha isolada com padrão V.172, V.173, etc.)
      const conjuntoMatch = line.match(/^([A-Z]+\.\d+)\s*$/i);
      if (conjuntoMatch && !conjuntoMatch[1].toUpperCase().startsWith('P')) {
        currentConjunto = conjuntoMatch[1];
        console.log(`📦 Conjunto tabular identificado: ${currentConjunto}`);
        continue;
      }
      
      // Também verificar se a linha contém um conjunto no início (mesmo com texto adicional)
      const conjuntoInLineMatch = line.match(/^([A-Z]+\.\d+)/i);
      if (conjuntoInLineMatch && !conjuntoInLineMatch[1].toUpperCase().startsWith('P') && line.length < 50) {
        currentConjunto = conjuntoInLineMatch[1];
        console.log(`📦 Conjunto em linha identificado: ${currentConjunto}`);
        continue;
      }

      // Detectar páginas
      if (line.includes('Página') || line.match(/^\s*\d+\s*$/)) {
        const pageMatch = line.match(/Página\s*(\d+)/i);
        if (pageMatch) {
          currentPage = parseInt(pageMatch[1]);
          console.log(`📄 Nova página: ${currentPage}`);
        }
        continue;
      }

      // Parse de peças formato tabular - múltiplas tentativas
      let tabularMatch = null;
      
      // Formato 1: Pos Qty Perfil Material Comp Peso (6 colunas)
      tabularMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+([\d,\.]+)\s*$/);
      
      // Formato 2: Pos Qty Descrição longa Comp Peso (pode ter espaços na descrição)
      if (!tabularMatch) {
        tabularMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(.*?)\s+(\d+)\s+([\d,\.]+)\s*$/);
      }
      
      // Formato 3: Mais flexível - qualquer linha com números no padrão correto
      if (!tabularMatch) {
        tabularMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(.*?)\s+(\d{3,})\s+([\d,\.]+)\s*$/);
      }
      
      if (tabularMatch) {
        console.log(`🎯 Match tabular encontrado: ${line}`);
        let posicao, quantidade, descricao, comprimento, peso;
        
        if (tabularMatch.length === 7) {
          // Formato com 6 grupos: pos, qty, perfil, material, comp, peso
          [, posicao, quantidade, , descricao, comprimento, peso] = tabularMatch;
        } else {
          // Formato com 5 grupos: pos, qty, descrição, comp, peso
          [, posicao, quantidade, descricao, comprimento, peso] = tabularMatch;
        }
        
        // Se não temos conjunto, tentar buscar nas proximidades com foco em V.XXX
        if (!currentConjunto) {
          console.log(`🔍 Buscando conjunto próximo à linha ${i}: "${line}"`);
          for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 3); j++) {
            const nearLine = lines[j].trim();
            // Buscar especificamente por padrão V.XXX
            const nearConjunto = nearLine.match(/^([A-Z]+\.\d+)\s*$/i);
            if (nearConjunto && !nearConjunto[1].toUpperCase().startsWith('P')) {
              currentConjunto = nearConjunto[1];
              console.log(`✅ Conjunto V.XXX encontrado próximo: ${currentConjunto} na linha ${j}: "${nearLine}"`);
              break;
            }
          }
          if (!currentConjunto) {
            console.log(`⚠️ Nenhum conjunto V.XXX encontrado, usando fallback: CONJUNTO_P${currentPage}`);
            currentConjunto = `CONJUNTO_P${currentPage}`;
          }
        }
        
        const tag = `${currentConjunto}-${posicao}`;
        const piece: any = {
          id: `autocad-tab-${currentConjunto}-${posicao}-${Date.now()}`,
          length: parseInt(comprimento),
          quantity: parseInt(quantidade),
          obra,
          conjunto: currentConjunto,
          posicao,
          perfil: this.normalizePerfil(descricao?.trim() || 'PERFIL'),
          material: 'MATERIAL',
          peso: parseFloat(peso.replace(',', '.')),
          tag,
          page: currentPage,
          dimensoes: {
            comprimento: parseInt(comprimento),
            largura: 0
          }
        };

        pieces.push(piece);
        console.log(`✅ Peça tabular: ${tag} - ${piece.length}mm - Qtd: ${piece.quantity} - Perfil: ${piece.perfil}`);
      } else {
        // Log para debug de linhas não reconhecidas
        if (line.length > 5 && line.match(/\d/) && !line.includes('Página') && !currentConjunto) {
          console.log(`❓ Linha não reconhecida: "${line}"`);
        }
      }
    }

    return pieces;
  }

  // Parser para formato pontilhado (original melhorado)
  private static parseDottedFormat(lines: string[]): CutPiece[] {
    console.log('🔸 Iniciando parse formato pontilhado...');
    const pieces: CutPiece[] = [];
    let obra = '';
    let currentConjunto = '';
    let esperandoConjunto = false;
    let currentPage = 1;
    
    // Extrair obra
    for (const line of lines) {
      const obraMatch = line.match(/OBRA:\s*(.+?)(?:\s+Data:|$)/i);
      if (obraMatch) {
        obra = obraMatch[1].trim();
        console.log('🏗️ Obra identificada:', obra);
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar linha pontilhada
      if (line.match(/^-{5,}$/)) {
        console.log('🔸 Linha pontilhada detectada');
        esperandoConjunto = true;
        currentConjunto = '';
        continue;
      }

      // Detectar conjunto após linha pontilhada
      if (esperandoConjunto && line.length > 0) {
        const conjuntoMatch = line.match(/^([A-Z]+\.?\d+)/i);
        if (conjuntoMatch && !conjuntoMatch[1].toUpperCase().startsWith('P')) {
          currentConjunto = conjuntoMatch[1];
          console.log(`📦 Conjunto pontilhado: ${currentConjunto}`);
          esperandoConjunto = false;
          continue;
        } else {
          esperandoConjunto = false;
        }
      }

      // Parse de peças formato detalhado
      const detailedMatch = line.match(/^\s*([Pp]?\d+)\s+(\d+)\s+(\S+)\s+([\w\d\-]+)\s+(\d+)\s+x?\s*(\d+)\s+([\d\.]+)$/i);
      if (detailedMatch) {
        const [, posicao, quantidade, perfil, material, comprimento, largura, peso] = detailedMatch;
        
        if (!currentConjunto) {
          // Buscar conjunto nas proximidades
          for (let j = Math.max(0, i - 15); j <= Math.min(lines.length - 1, i + 5); j++) {
            const nearLine = lines[j].trim();
            const nearConjunto = nearLine.match(/^([A-Z]+\.?\d+)/i);
            if (nearConjunto && !nearConjunto[1].toUpperCase().startsWith('P')) {
              currentConjunto = nearConjunto[1];
              break;
            }
          }
          if (!currentConjunto) {
            currentConjunto = `CONJUNTO_P${currentPage}`;
          }
        }
        
        const tag = `${currentConjunto}-${posicao}`;
        const piece: any = {
          id: `autocad-dot-${currentConjunto}-${posicao}-${Date.now()}`,
          length: parseInt(comprimento),
          quantity: parseInt(quantidade),
          obra,
          conjunto: currentConjunto,
          posicao,
          perfil: this.normalizePerfil(perfil.trim()),
          material: material.trim(),
          peso: parseFloat(peso),
          tag,
          page: currentPage,
          dimensoes: {
            comprimento: parseInt(comprimento),
            largura: parseInt(largura)
          }
        };

        pieces.push(piece);
        console.log(`✅ Peça pontilhada: ${tag} - ${piece.length}mm - Qtd: ${piece.quantity}`);
      }
    }

    return pieces;
  }

  // Método para normalizar descrições de perfis
  static normalizePerfil(perfil: string): string {
    return perfil
      .replace(/\s+/g, '') // Remove todos os espaços
      .replace(/X/gi, 'X') // Padroniza o X
      .replace(/x/g, 'X')
      .toUpperCase();
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
    // Verificar se é arquivo AutoCAD primeiro
    if (content.includes('LM por Conjunto') || content.includes('OBRA:')) {
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
