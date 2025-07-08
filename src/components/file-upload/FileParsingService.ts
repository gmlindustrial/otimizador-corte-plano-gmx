
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
    console.log('Iniciando parsing de arquivo AutoCAD...');
    console.log('Primeiras 10 linhas do arquivo:', content.split('\n').slice(0, 10));
    
    const lines = content.split('\n');
    const pieces: CutPiece[] = [];
    
    // Verificar se é arquivo AutoCAD válido com critérios mais flexíveis
    const isAutoCADFile = lines.some(line => 
      line.includes('LM por Conjunto') || 
      line.includes('METALMAX') ||
      line.includes('OBRA:') ||
      line.includes('C34') ||
      line.includes('C35') ||
      line.match(/[A-Z]\d+/) // Qualquer padrão tipo C34, V172, etc.
    );
    
    console.log('Arquivo identificado como AutoCAD:', isAutoCADFile);
    
    if (!isAutoCADFile) {
      throw new Error('Arquivo não parece ser um relatório AutoCAD válido');
    }

    let obra = '';
    let currentConjunto = '';
    let esperandoConjunto = false; // Flag para indicar que esperamos um conjunto após linha pontilhada
    
    // Extrair nome da obra
    for (const line of lines) {
      const obraMatch = line.match(/OBRA:\s*(.+?)(?:\s+Data:|$)/);
      if (obraMatch) {
        obra = obraMatch[1].trim();
        console.log('Obra identificada:', obra);
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar linha pontilhada - prepara para novo conjunto
      if (line.match(/^-{5,}$/)) {
        console.log('Linha pontilhada detectada - preparando para novo conjunto');
        esperandoConjunto = true; // Próxima linha não-vazia pode ser conjunto
        currentConjunto = ''; // Reset conjunto atual
        continue;
      }

      // Detectar conjunto apenas se estiver esperando após linha pontilhada
      if (esperandoConjunto && line.length > 0) {
        const conjuntoMatch = line.match(/^([A-Z]+(?:-\d+|\d+))\s*(\d+)?\s*([A-Z].*)?$/);
        if (conjuntoMatch) {
          currentConjunto = conjuntoMatch[1];
          const descricao = conjuntoMatch[3] || '';
          console.log(`Conjunto identificado após linha pontilhada: ${currentConjunto}${descricao ? ` (${descricao})` : ''}`);
          esperandoConjunto = false; // Conjunto encontrado, não precisa mais esperar
          continue;
        } else {
          // Linha não é conjunto, pode ser início das peças
          esperandoConjunto = false;
        }
      }

      // Parsear linha de peça com regex mais flexível
      if (line.length > 0 && !line.match(/^-+$/) && !line.includes('Conjunto') && !line.includes('OBRA:')) {
        console.log(`Analisando linha: "${line}" - Conjunto atual: ${currentConjunto}`);
        
        // Regex melhorada para capturar diferentes formatos
        const pieceMatch = line.match(/^\s*(\d+)\s+(\d+)\s+([\w\d\-\s\.\+\*]+?)\s+([\w\d\-]+)\s+(\d+)\s+x?\s*(\d+)\s+([\d\.]+)$/i);
        
        if (pieceMatch) {
          const [, posicao, quantidade, perfil, material, comprimento, largura, peso] = pieceMatch;
          console.log(`Regex principal detectou: pos=${posicao}, qty=${quantidade}, perfil=${perfil}, mat=${material}, comp=${comprimento}, larg=${largura}, peso=${peso} - Conjunto: ${currentConjunto}`);
          
          // Se não temos conjunto válido (definido por linha pontilhada), usar genérico
          if (!currentConjunto) {
            currentConjunto = 'CONJUNTO';
            console.log('Nenhum conjunto válido encontrado, usando CONJUNTO genérico');
          }
          
          const tag = `${currentConjunto}-${posicao}`;
          
          const piece: any = {
            id: `autocad-${currentConjunto}-${posicao}-${Date.now()}`,
            length: parseInt(comprimento),
            quantity: parseInt(quantidade),
            obra,
            conjunto: currentConjunto,
            posicao: parseInt(posicao),
            perfil: perfil.trim(),
            material: material.trim(),
            peso: parseFloat(peso),
            tag,
            dimensoes: {
              comprimento: parseInt(comprimento),
              largura: parseInt(largura)
            }
          };

          pieces.push(piece);
          
          console.log(`Peça adicionada: ${tag} - ${piece.length}mm - Qtd: ${piece.quantity} - Perfil: ${piece.perfil} - Conjunto: ${currentConjunto}`);
        } else {
          // Tentar regex mais simples para formato: pos qty descricao comprimento peso
          const simpleMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(.+?)\s+(\d+)\s+([\d\.]+)$/);
          if (simpleMatch) {
            const [, posicao, quantidade, descricao, comprimento, peso] = simpleMatch;
            console.log(`Regex simples detectou: pos=${posicao}, qty=${quantidade}, desc=${descricao}, comp=${comprimento}, peso=${peso} - Conjunto: ${currentConjunto}`);
            
            if (!currentConjunto) {
              currentConjunto = 'CONJUNTO';
            }
            
            const tag = `${currentConjunto}-${posicao}`;
            
            const piece: any = {
              id: `autocad-simple-${currentConjunto}-${posicao}-${Date.now()}`,
              length: parseInt(comprimento),
              quantity: parseInt(quantidade),
              obra,
              conjunto: currentConjunto,
              posicao: parseInt(posicao),
              perfil: descricao.trim(),
              peso: parseFloat(peso),
              tag,
              dimensoes: {
                comprimento: parseInt(comprimento),
                largura: 0
              }
            };

            pieces.push(piece);
            console.log(`Peça simples adicionada: ${tag} - ${piece.length}mm - Qtd: ${piece.quantity} - Conjunto: ${currentConjunto}`);
          } else {
            console.log(`Linha não reconhecida: "${line}"`);
          }
        }
      }
    }

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça foi encontrada no arquivo AutoCAD');
    }

    console.log(`Total de peças extraídas: ${pieces.length}`);
    console.log(`Obra: ${obra}`);
    console.log('Conjuntos encontrados:', [...new Set(pieces.map(p => (p as any).conjunto))]);
    
    return pieces;
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
