
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
    
    const lines = content.split('\n');
    const pieces: CutPiece[] = [];
    
    // Verificar se é arquivo AutoCAD válido
    const isAutoCADFile = lines.some(line => 
      line.includes('LM por Conjunto') || 
      line.includes('METALMAX') ||
      line.includes('OBRA:')
    );
    
    if (!isAutoCADFile) {
      throw new Error('Arquivo não parece ser um relatório AutoCAD válido');
    }

    let obra = '';
    let currentConjunto = '';
    
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
      
      // Detectar conjunto entre linhas pontilhadas
      if (line.match(/^-{5,}$/)) {
        // Verificar se a próxima linha contém um conjunto
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const conjuntoMatch = nextLine.match(/^(V\.\d+)\s+(\d+)\s+([A-Z])$/);
          if (conjuntoMatch) {
            currentConjunto = conjuntoMatch[1]; // V.172, V.173, etc.
            console.log('Conjunto identificado:', currentConjunto);
            i++; // Pular a linha do conjunto
            continue;
          }
        }
      }

      // Parsear linha de peça
      if (currentConjunto && line.length > 0 && !line.match(/^-+$/) && !line.includes('Conjunto')) {
        // Regex para capturar: posição, quantidade, perfil, material, dimensões, peso
        const pieceMatch = line.match(/^\s*(\d+)\s+(\d+)\s+(L\s+\d+\s+X\s+[\d.]+)\s+(A\d+)\s+(\d+)\s+x\s+(\d+)\s+([\d.]+)$/);
        
        if (pieceMatch) {
          const [, posicao, quantidade, perfil, material, comprimento, largura, peso] = pieceMatch;
          
          const tag = `${currentConjunto}-${posicao}`;
          
          const piece: any = {
            id: `autocad-${currentConjunto}-${posicao}-${Date.now()}`,
            length: parseInt(comprimento),
            quantity: parseInt(quantidade),
            obra,
            conjunto: currentConjunto,
            posicao,
            perfil: perfil.trim(),
            material,
            peso: parseFloat(peso),
            tag,
            dimensoes: {
              comprimento: parseInt(comprimento),
              largura: parseInt(largura)
            }
          };

          pieces.push(piece);
          
          console.log(`Peça adicionada: ${tag} - ${piece.length}mm - Qtd: ${piece.quantity}`);
        }
      }
    }

    if (pieces.length === 0) {
      throw new Error('Nenhuma peça foi encontrada no arquivo AutoCAD');
    }

    console.log(`Total de peças extraídas: ${pieces.length}`);
    console.log(`Obra: ${obra}`);
    
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
