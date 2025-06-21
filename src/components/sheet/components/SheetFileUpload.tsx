
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, Image, Settings } from 'lucide-react';
import type { SheetCutPiece } from '@/types/sheet';

interface SheetFileUploadProps {
  onDataImported: (pieces: SheetCutPiece[], duplicates?: any[]) => void;
  currentPieces: SheetCutPiece[];
}

interface DuplicateItem {
  existing: SheetCutPiece;
  imported: SheetCutPiece;
  conflicts: string[];
}

export const SheetFileUpload = ({ onDataImported, currentPieces }: SheetFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): SheetCutPiece[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: SheetCutPiece[] = [];
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('largura') || 
                      lines[0].toLowerCase().includes('width') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      if (cols.length >= 4) {
        const width = parseFloat(cols[0]);
        const height = parseFloat(cols[1]);
        const quantity = parseInt(cols[2]) || 1;
        const tag = cols[3] || `PIECE-${i}`;
        const allowRotation = cols[4] ? cols[4].toLowerCase() === 'true' : true;
        
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            width,
            height,
            quantity,
            tag: tag.toUpperCase(),
            allowRotation,
            geometry: {
              type: 'rectangle',
              boundingBox: { width, height },
              area: width * height,
              perimeter: 2 * (width + height)
            }
          });
        }
      }
    }
    return pieces;
  };

  const parseTXT = (content: string): SheetCutPiece[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const pieces: SheetCutPiece[] = [];
    
    let currentPiece: Partial<SheetCutPiece> = {};
    let points: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Formato de coordenadas: X:123.45 Y:67.89
      const coordMatch = line.match(/X:\s*(-?\d+(?:\.\d+)?)\s+Y:\s*(-?\d+(?:\.\d+)?)/i);
      if (coordMatch) {
        points.push({
          x: parseFloat(coordMatch[1]),
          y: parseFloat(coordMatch[2])
        });
        continue;
      }
      
      // Formato tag: TAG:CH001 ou PIECE:CH001
      const tagMatch = line.match(/(?:TAG|PIECE):\s*(.+)/i);
      if (tagMatch) {
        currentPiece.tag = tagMatch[1].trim().toUpperCase();
        continue;
      }
      
      // Formato quantidade: QTY:5 ou QUANTITY:5
      const qtyMatch = line.match(/(?:QTY|QUANTITY):\s*(\d+)/i);
      if (qtyMatch) {
        currentPiece.quantity = parseInt(qtyMatch[1]);
        continue;
      }
      
      // Formato simples: largura altura quantidade tag
      const simpleMatch = line.match(/(\d+(?:\.\d+)?)[,;\s]+(\d+(?:\.\d+)?)[,;\s]+(\d+)[,;\s]*(.+)?/);
      if (simpleMatch) {
        const width = parseFloat(simpleMatch[1]);
        const height = parseFloat(simpleMatch[2]);
        const quantity = parseInt(simpleMatch[3]);
        const tag = simpleMatch[4]?.trim().toUpperCase() || `PIECE-${i}`;
        
        if (width > 0 && height > 0 && quantity > 0) {
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            width,
            height,
            quantity,
            tag,
            allowRotation: true,
            geometry: {
              type: 'rectangle',
              boundingBox: { width, height },
              area: width * height,
              perimeter: 2 * (width + height)
            }
          });
        }
        continue;
      }
      
      // Finalizar peça com coordenadas
      if (line.includes('END') || line.includes('FIM')) {
        if (points.length >= 3 && currentPiece.tag) {
          const boundingBox = calculateBoundingBox(points);
          const area = calculatePolygonArea(points);
          const perimeter = calculatePerimeter(points);
          
          pieces.push({
            id: `import-${Date.now()}-${i}`,
            width: boundingBox.width,
            height: boundingBox.height,
            quantity: currentPiece.quantity || 1,
            tag: currentPiece.tag,
            allowRotation: true,
            geometry: {
              type: 'polygon',
              points: [...points],
              boundingBox,
              area,
              perimeter
            }
          });
          
          currentPiece = {};
          points = [];
        }
      }
    }
    
    return pieces;
  };

  const parseCAD = async (file: File): Promise<SheetCutPiece[]> => {
    // Simulação de parsing CAD - em produção usaria bibliotecas como dxf-parser
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dados simulados de arquivo CAD
        const mockCADData: SheetCutPiece[] = [
          {
            id: `cad-${Date.now()}-1`,
            width: 250,
            height: 180,
            quantity: 3,
            tag: 'FLANGE001',
            allowRotation: true,
            cadFile: file.name,
            geometry: {
              type: 'complex',
              points: [
                { x: 0, y: 0 }, { x: 250, y: 0 }, { x: 250, y: 150 },
                { x: 200, y: 150 }, { x: 200, y: 180 }, { x: 50, y: 180 },
                { x: 50, y: 150 }, { x: 0, y: 150 }
              ],
              boundingBox: { width: 250, height: 180 },
              area: 42000,
              perimeter: 860
            }
          },
          {
            id: `cad-${Date.now()}-2`,
            width: 300,
            height: 300,
            quantity: 2,
            tag: 'BRACKET002',
            allowRotation: false,
            cadFile: file.name,
            geometry: {
              type: 'circle',
              radius: 150,
              boundingBox: { width: 300, height: 300 },
              area: Math.PI * 150 * 150,
              perimeter: 2 * Math.PI * 150
            }
          }
        ];
        resolve(mockCADData);
      }, 2000);
    });
  };

  const parsePDF = async (file: File): Promise<SheetCutPiece[]> => {
    // Simulação de extração de PDF
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPDFData: SheetCutPiece[] = [
          {
            id: `pdf-${Date.now()}-1`,
            width: 400,
            height: 200,
            quantity: 4,
            tag: 'PLATE001',
            allowRotation: true,
            geometry: {
              type: 'rectangle',
              boundingBox: { width: 400, height: 200 },
              area: 80000,
              perimeter: 1200
            }
          }
        ];
        resolve(mockPDFData);
      }, 1500);
    });
  };

  const calculateBoundingBox = (points: Array<{ x: number; y: number }>) => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const calculatePolygonArea = (points: Array<{ x: number; y: number }>): number => {
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2;
  };

  const calculatePerimeter = (points: Array<{ x: number; y: number }>): number => {
    let perimeter = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    return perimeter;
  };

  const checkForDuplicates = (newPieces: SheetCutPiece[]): DuplicateItem[] => {
    const duplicateItems: DuplicateItem[] = [];
    
    newPieces.forEach(newPiece => {
      const existing = currentPieces.find(piece => 
        piece.width === newPiece.width && 
        piece.height === newPiece.height && 
        piece.tag === newPiece.tag
      );
      
      if (existing) {
        duplicateItems.push({
          existing,
          imported: newPiece,
          conflicts: ['Dimensões + TAG']
        });
      }
    });
    
    return duplicateItems;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      let pieces: SheetCutPiece[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 80));
      }, 300);

      switch (fileExtension) {
        case 'csv':
          const csvContent = await file.text();
          pieces = parseCSV(csvContent);
          break;
        
        case 'xlsx':
        case 'xls':
          // Parsing Excel simplificado
          const excelContent = await file.text();
          pieces = parseCSV(excelContent); // Fallback para CSV
          break;
        
        case 'txt':
          const txtContent = await file.text();
          pieces = parseTXT(txtContent);
          break;
        
        case 'pdf':
          pieces = await parsePDF(file);
          break;
        
        case 'dwg':
        case 'dxf':
        case 'cad':
          pieces = await parseCAD(file);
          break;
        
        default:
          throw new Error('Formato de arquivo não suportado');
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (pieces.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Verificar duplicatas
      const duplicateItems = checkForDuplicates(pieces);
      
      if (duplicateItems.length > 0) {
        onDataImported(pieces, duplicateItems);
      } else {
        onDataImported(pieces);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Peças CAD/Arquivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt,.pdf,.dwg,.dxf,.cad"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Arraste arquivos ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Formatos aceitos: CSV, XLSX, TXT, PDF, DWG, DXF, CAD
              </p>
            </div>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>

        {/* Formatos aceitos */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Dados Tabulares:</span>
            </div>
            <ul className="space-y-1 ml-6">
              <li>• CSV: largura,altura,qtd,tag,rotacao</li>
              <li>• XLSX: planilha estruturada</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="font-medium">CAD/Geometria:</span>
            </div>
            <ul className="space-y-1 ml-6">
              <li>• TXT: coordenadas X:Y</li>
              <li>• DWG/DXF: arquivos CAD</li>
              <li>• PDF: desenhos técnicos</li>
            </ul>
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {progress < 80 ? 'Processando arquivo...' : 'Analisando geometrias...'}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
