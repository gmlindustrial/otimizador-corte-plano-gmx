
import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SheetOptimizationResult, SheetProject } from '@/types/sheet';
import { Eye, Download, ZoomIn, ZoomOut, Grid, Ruler, Palette, RotateCcw } from 'lucide-react';

interface SheetVisualizationProps {
  results: SheetOptimizationResult;
  project: SheetProject | null;
}

interface ViewSettings {
  showGrid: boolean;
  showDimensions: boolean;
  showTags: boolean;
  colorMode: 'pieces' | 'efficiency' | 'size';
  transparency: number;
}

export const SheetVisualization = ({ results, project }: SheetVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    showGrid: true,
    showDimensions: true,
    showTags: true,
    colorMode: 'pieces',
    transparency: 80
  });
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  const drawSheet = useCallback((sheetIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sheet = results.sheets[sheetIndex];
    if (!sheet) return;

    // Configurações do canvas
    const padding = 50;
    const maxScale = Math.min(
      (canvas.width - padding * 2) / project.sheetWidth,
      (canvas.height - padding * 2) / project.sheetHeight
    );
    const scale = maxScale * zoom;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar transformação
    ctx.save();
    ctx.translate(padding + canvasOffset.x, padding + canvasOffset.y);

    // Desenhar grade se habilitada
    if (viewSettings.showGrid) {
      drawGrid(ctx, scale);
    }

    // Desenhar borda da chapa
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, project.sheetWidth * scale, project.sheetHeight * scale);

    // Título da chapa
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Chapa ${sheetIndex + 1} - ${sheet.efficiency.toFixed(1)}% eficiente`,
      0,
      -15
    );

    // Desenhar peças
    sheet.pieces.forEach((piece, index) => {
      drawPiece(ctx, piece, index, scale, sheet.pieces.length);
    });

    // Desenhar informações da chapa
    drawSheetInfo(ctx, project, scale);

    ctx.restore();
  }, [results, project, zoom, viewSettings, hoveredPiece, canvasOffset]);

  const drawGrid = (ctx: CanvasRenderingContext2D, scale: number) => {
    if (!project) return;
    
    const gridSize = 100; // 100mm
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= project.sheetWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, project.sheetHeight * scale);
      ctx.stroke();
    }
    
    for (let y = 0; y <= project.sheetHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(project.sheetWidth * scale, y * scale);
      ctx.stroke();
    }
  };

  const drawPiece = (
    ctx: CanvasRenderingContext2D, 
    piece: any, 
    index: number, 
    scale: number, 
    totalPieces: number
  ) => {
    const x = piece.x * scale;
    const y = piece.y * scale;
    const width = piece.width * scale;
    const height = piece.height * scale;

    // Determinar cor baseada no modo
    let fillColor = piece.color;
    switch (viewSettings.colorMode) {
      case 'efficiency':
        const efficiency = (piece.width * piece.height) / (project!.sheetWidth * project!.sheetHeight) * 100;
        fillColor = efficiency > 15 ? '#10b981' : efficiency > 10 ? '#f59e0b' : '#ef4444';
        break;
      case 'size':
        const area = piece.width * piece.height;
        const normalizedSize = area / (project!.sheetWidth * project!.sheetHeight);
        const hue = normalizedSize * 120; // 0 (vermelho) a 120 (verde)
        fillColor = `hsl(${hue}, 70%, 50%)`;
        break;
    }

    // Aplicar transparência
    const alpha = viewSettings.transparency / 100;
    ctx.fillStyle = fillColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
    
    // Destacar se hover
    if (hoveredPiece === piece.tag) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
    }

    // Preencher peça
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;

    // Contorno da peça
    ctx.strokeStyle = hoveredPiece === piece.tag ? '#d97706' : '#374151';
    ctx.lineWidth = hoveredPiece === piece.tag ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Desenhar tag se habilitada
    if (viewSettings.showTags && scale > 0.3) {
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold ${Math.max(10, 14 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = piece.tag + (piece.rotation === 90 ? ' ↻' : '');
      
      // Fundo semi-transparente para texto
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width + 8;
      const textHeight = 20;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        x + width / 2 - textWidth / 2,
        y + height / 2 - textHeight / 2,
        textWidth,
        textHeight
      );
      
      ctx.fillStyle = '#1f2937';
      ctx.fillText(text, x + width / 2, y + height / 2);
    }

    // Desenhar dimensões se habilitadas
    if (viewSettings.showDimensions && scale > 0.5) {
      ctx.fillStyle = '#6b7280';
      ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      
      const dimText = `${piece.width}×${piece.height}`;
      ctx.fillText(dimText, x + width / 2, y + height - 5);
    }

    // Indicador de rotação
    if (piece.rotation === 90 && scale > 0.4) {
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(x + width - 8, y + 8, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawSheetInfo = (ctx: CanvasRenderingContext2D, project: SheetProject, scale: number) => {
    const sheetWidth = project.sheetWidth * scale;
    const sheetHeight = project.sheetHeight * scale;
    
    // Dimensões da chapa
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${project.sheetWidth} × ${project.sheetHeight}mm`,
      0,
      sheetHeight + 25
    );
    
    // Material e espessura
    ctx.fillText(
      `${project.material} - ${project.thickness}mm`,
      0,
      sheetHeight + 40
    );
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Converter para coordenadas da chapa
    const padding = 50;
    const scale = Math.min(
      (canvas.width - padding * 2) / project.sheetWidth,
      (canvas.height - padding * 2) / project.sheetHeight
    ) * zoom;

    const sheetX = (clickX - padding - canvasOffset.x) / scale;
    const sheetY = (clickY - padding - canvasOffset.y) / scale;

    // Verificar qual peça foi clicada
    const sheet = results.sheets[selectedSheet];
    if (sheet) {
      const clickedPiece = sheet.pieces.find(piece => 
        sheetX >= piece.x && 
        sheetX <= piece.x + piece.width &&
        sheetY >= piece.y && 
        sheetY <= piece.y + piece.height
      );

      if (clickedPiece) {
        setHoveredPiece(hoveredPiece === clickedPiece.tag ? null : clickedPiece.tag);
      } else {
        setHoveredPiece(null);
      }
    }
  };

  const handleDownload = (format: 'png' | 'svg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `chapa-${selectedSheet + 1}-${project?.projectNumber || 'projeto'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const handleResetView = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (results.sheets.length > 0) {
      drawSheet(selectedSheet);
    }
  }, [selectedSheet, zoom, viewSettings, hoveredPiece, canvasOffset, drawSheet]);

  if (results.sheets.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6 text-center text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Nenhum resultado para visualizar</p>
          <p className="text-sm">Execute uma otimização primeiro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Visualização Avançada do Layout
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Controles Principais */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Chapa:</Label>
              <div className="flex gap-1">
                {results.sheets.map((sheet, index) => (
                  <Button
                    key={index}
                    variant={selectedSheet === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSheet(index)}
                    className="min-w-[40px]"
                  >
                    {index + 1}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {sheet.efficiency.toFixed(0)}%
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Badge variant="outline" className="min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload('png')}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Configurações de Visualização */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Modo de Cor</Label>
            <Select value={viewSettings.colorMode} onValueChange={(value: any) => 
              setViewSettings(prev => ({ ...prev, colorMode: value }))}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pieces">Por Peça</SelectItem>
                <SelectItem value="efficiency">Por Eficiência</SelectItem>
                <SelectItem value="size">Por Tamanho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Transparência</Label>
            <Slider
              value={[viewSettings.transparency]}
              onValueChange={([value]) => 
                setViewSettings(prev => ({ ...prev, transparency: value }))}
              max={100}
              min={20}
              step={10}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={viewSettings.showGrid}
                onCheckedChange={(checked) => 
                  setViewSettings(prev => ({ ...prev, showGrid: checked }))}
              />
              <Label className="text-sm">Grade</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={viewSettings.showDimensions}
                onCheckedChange={(checked) => 
                  setViewSettings(prev => ({ ...prev, showDimensions: checked }))}
              />
              <Label className="text-sm">Dimensões</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={viewSettings.showTags}
                onCheckedChange={(checked) => 
                  setViewSettings(prev => ({ ...prev, showTags: checked }))}
              />
              <Label className="text-sm">Tags</Label>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-inner">
          <canvas
            ref={canvasRef}
            width={900}
            height={700}
            className="w-full h-auto max-h-[700px] cursor-crosshair"
            style={{ display: 'block' }}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Informações da chapa atual */}
        {results.sheets[selectedSheet] && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Chapa {selectedSheet + 1} - Detalhes</h4>
              {hoveredPiece && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Selecionada: {hoveredPiece}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Peças:</span>
                <div className="font-medium">{results.sheets[selectedSheet].pieces.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Eficiência:</span>
                <div className="font-medium text-green-600">
                  {results.sheets[selectedSheet].efficiency.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-600">Área Utilizada:</span>
                <div className="font-medium">
                  {(results.sheets[selectedSheet].utilizedArea / 1000000).toFixed(2)} m²
                </div>
              </div>
              <div>
                <span className="text-gray-600">Sobra:</span>
                <div className="font-medium text-orange-600">
                  {(results.sheets[selectedSheet].wasteArea / 1000000).toFixed(2)} m²
                </div>
              </div>
              <div>
                <span className="text-gray-600">Peso:</span>
                <div className="font-medium">{results.sheets[selectedSheet].weight.toFixed(2)} kg</div>
              </div>
            </div>
            
            {/* Lista de peças na chapa */}
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-2">Peças na chapa (clique para destacar):</div>
              <div className="flex flex-wrap gap-1">
                {results.sheets[selectedSheet].pieces.map((piece, pieceIndex) => (
                  <Badge 
                    key={pieceIndex} 
                    variant={hoveredPiece === piece.tag ? "default" : "outline"} 
                    className="text-xs cursor-pointer hover:bg-blue-100"
                    onClick={() => setHoveredPiece(hoveredPiece === piece.tag ? null : piece.tag)}
                  >
                    {piece.tag} ({piece.width}×{piece.height}
                    {piece.rotation === 90 ? ' ↻' : ''})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p><strong>Instruções:</strong></p>
          <p>• Clique nas peças ou badges para destacá-las</p>
          <p>• Use os controles de zoom para ver detalhes</p>
          <p>• Mude o modo de cor para diferentes visualizações</p>
          <p>• Símbolo ↻ indica peça rotacionada 90°</p>
        </div>
      </CardContent>
    </Card>
  );
};
