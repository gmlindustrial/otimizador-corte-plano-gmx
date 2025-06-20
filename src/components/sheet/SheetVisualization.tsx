
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import { Eye, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface SheetVisualizationProps {
  results: SheetOptimizationResult;
  project: SheetProject | null;
}

export const SheetVisualization = ({ results, project }: SheetVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (results.sheets.length > 0) {
      drawSheet(selectedSheet);
    }
  }, [results, selectedSheet, zoom]);

  const drawSheet = (sheetIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sheet = results.sheets[sheetIndex];
    if (!sheet) return;

    // Configurar canvas
    const padding = 40;
    const scale = Math.min(
      (canvas.width - padding * 2) / project.sheetWidth,
      (canvas.height - padding * 2) / project.sheetHeight
    ) * zoom;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar borda da chapa
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      padding, 
      padding, 
      project.sheetWidth * scale, 
      project.sheetHeight * scale
    );

    // Desenhar peças
    sheet.pieces.forEach((piece, index) => {
      const x = padding + piece.x * scale;
      const y = padding + piece.y * scale;
      const width = piece.width * scale;
      const height = piece.height * scale;

      // Preencher peça
      ctx.fillStyle = piece.color + '80'; // Semi-transparente
      ctx.fillRect(x, y, width, height);

      // Contorno da peça
      ctx.strokeStyle = piece.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);

      // Tag da peça
      ctx.fillStyle = '#000000';
      ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = piece.tag + (piece.rotation === 90 ? ' ↻' : '');
      ctx.fillText(text, x + width / 2, y + height / 2);

      // Dimensões
      if (zoom > 0.5) {
        ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `${piece.width}x${piece.height}`,
          x + width / 2,
          y + height / 2 + 15 * zoom
        );
      }
    });

    // Título da chapa
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Chapa ${sheetIndex + 1} - ${sheet.efficiency.toFixed(1)}% eficiente`,
      padding,
      padding - 10
    );

    // Dimensões da chapa
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(
      `${project.sheetWidth}x${project.sheetHeight}mm`,
      padding,
      canvas.height - padding + 25
    );
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `chapa-${selectedSheet + 1}-${project?.projectNumber || 'projeto'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));

  if (results.sheets.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6 text-center text-gray-500">
          Nenhum resultado para visualizar
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Visualização do Layout
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Controles */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Chapa:</span>
            <div className="flex gap-1">
              {results.sheets.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedSheet === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSheet(index)}
                  className="min-w-[40px]"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Badge variant="outline">{Math.round(zoom * 100)}%</Badge>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-auto max-h-[600px]"
            style={{ display: 'block' }}
          />
        </div>

        {/* Informações da chapa atual */}
        {results.sheets[selectedSheet] && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Chapa {selectedSheet + 1}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Peças:</span>
                <div className="font-medium">{results.sheets[selectedSheet].pieces.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Eficiência:</span>
                <div className="font-medium">{results.sheets[selectedSheet].efficiency.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Área Utilizada:</span>
                <div className="font-medium">{(results.sheets[selectedSheet].utilizedArea / 1000000).toFixed(2)} m²</div>
              </div>
              <div>
                <span className="text-gray-600">Sobra:</span>
                <div className="font-medium">{(results.sheets[selectedSheet].wasteArea / 1000000).toFixed(2)} m²</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
