import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  X, ZoomIn, ZoomOut, Search, Filter, ChevronLeft, ChevronRight, 
  Package, Tag, Wrench, Printer, Check, Square, Recycle, MapPin, DollarSign
} from 'lucide-react';
import type { OptimizationResult, Project } from '@/pages/Index';

interface FullscreenReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  results: OptimizationResult;
  barLength: number;
  project: Project | null;
  onResultsChange?: (results: OptimizationResult) => void;
}

export const FullscreenReportViewer = ({
  isOpen,
  onClose,
  results,
  barLength,
  project,
  onResultsChange
}: FullscreenReportViewerProps) => {
  const [selectedBar, setSelectedBar] = useState<number>(0);
  const [svgZoomLevel, setSvgZoomLevel] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterByConjunto, setFilterByConjunto] = useState<string>('');
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);
  const [checkedPieces, setCheckedPieces] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('detailed');
  const [showLegend, setShowLegend] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const initial = new Set<string>();
    results.bars.forEach((bar, bIdx) => {
      bar.pieces.forEach((piece: any) => {
        if (piece.cortada) {
          initial.add(`${bIdx}-${piece.tag || piece.length}`);
        }
      });
    });
    setCheckedPieces(initial);
  }, [isOpen, results]);

  // Extrair conjuntos únicos
  const allConjuntos = new Set<string>();
  results.bars.forEach(bar => {
    bar.pieces.forEach((piece: any) => {
      if (piece.conjunto) allConjuntos.add(piece.conjunto);
    });
  });

  // Filtrar dados baseado na busca e filtros
  const filteredBars = results.bars.map((bar, barIndex) => ({
    ...bar,
    barIndex,
    pieces: bar.pieces.filter((piece: any) => {
      const matchesSearch = !searchTerm || 
        (piece.tag && piece.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (piece.conjunto && piece.conjunto.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesConjunto = !filterByConjunto || piece.conjunto === filterByConjunto;
      
      const pieceId = `${barIndex}-${piece.tag || piece.length}`;
      const matchesPending = !showOnlyPending || !checkedPieces.has(pieceId);
      
      return matchesSearch && matchesConjunto && matchesPending;
    })
  })).filter(bar => bar.pieces.length > 0);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setSelectedBar(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          setSelectedBar(prev => Math.min(filteredBars.length - 1, prev + 1));
          break;
        case '+':
          setSvgZoomLevel(prev => Math.min(2, prev + 0.1));
          break;
        case '-':
          setSvgZoomLevel(prev => Math.max(0.5, prev - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, filteredBars.length]);

  const togglePieceCheck = (barIndex: number, piece: any) => {
    const pieceId = `${barIndex}-${piece.tag || piece.length}`;
    const newChecked = new Set(checkedPieces);

    let checked: boolean;
    if (newChecked.has(pieceId)) {
      newChecked.delete(pieceId);
      checked = false;
    } else {
      newChecked.add(pieceId);
      checked = true;
    }

    piece.cortada = checked;
    setCheckedPieces(newChecked);
    onResultsChange?.(results);
  };

  const currentBar = filteredBars[selectedBar];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Agrupar peças por conjunto para legenda
  const conjuntoLegend = new Map<string, { color: string; count: number }>();
  
  results.bars.forEach(bar => {
    bar.pieces.forEach((piece: any) => {
      if (piece.conjunto && !conjuntoLegend.has(piece.conjunto)) {
        conjuntoLegend.set(piece.conjunto, { 
          color: piece.color, 
          count: results.bars.reduce((total, b) => 
            total + b.pieces.filter((p: any) => p.conjunto === piece.conjunto).length, 0
          )
        });
      }
    });
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-white m-0 rounded-none border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Visualização Completa - {project?.projectNumber || 'Projeto'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">
                Visualização Completa - {project?.projectNumber || 'Projeto'}
              </h2>
              <Badge variant="outline">
                {filteredBars.length} barras | {results.efficiency.toFixed(1)}% eficiência
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Controles de Zoom SVG */}
              <Button variant="outline" size="sm" onClick={() => setSvgZoomLevel(prev => Math.max(0.5, prev - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono">{(svgZoomLevel * 100).toFixed(0)}%</span>
              <Button variant="outline" size="sm" onClick={() => setSvgZoomLevel(prev => Math.min(2, prev + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              {/* Toggle Legenda */}
              <Button 
                variant={showLegend ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
              >
                <Square className="w-4 h-4 mr-1" />
                Legenda
              </Button>
              
              {/* Imprimir */}
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
              </Button>
              
              {/* Single X button */}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Legenda de Identificação */}
          {showLegend && (
            <div className="p-4 border-b bg-blue-50 flex-shrink-0">
              <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                <Square className="w-4 h-4" />
                Legenda de Identificação
              </h4>
              
              {/* Código de Cores das Barras */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Código de Cores das Barras</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded border bg-green-500" />
                    <span className="text-sm text-gray-700 font-medium">Verde: Barra de sobra utilizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded border bg-blue-500" />
                    <span className="text-sm text-gray-700 font-medium">Azul: Barra nova</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded border bg-orange-500" />
                    <span className="text-sm text-gray-700 font-medium">Laranja: Sobra parcialmente utilizada</span>
                  </div>
                </div>
              </div>

              {/* Indicadores de Tipo de Barra */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Indicadores de Tipo</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Recycle className="w-3 h-3 mr-1" />
                      SOBRA
                    </Badge>
                    <span className="text-sm text-gray-700">Material reutilizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      NOVA
                    </Badge>
                    <span className="text-sm text-gray-700">Material novo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Localização no estoque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Economia gerada</span>
                  </div>
                </div>
              </div>

              {/* Conjuntos compactos */}
              {conjuntoLegend.size > 0 && (
                <div className="mb-2">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Conjuntos
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(conjuntoLegend.entries()).slice(0, 8).map(([conjunto, data]) => (
                      <div key={conjunto} className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                        <div 
                          className="w-3 h-3 rounded border" 
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-xs text-gray-700">{conjunto}</span>
                        <Badge variant="outline" className="text-xs h-4 px-1">{data.count}</Badge>
                      </div>
                    ))}
                    {conjuntoLegend.size > 8 && (
                      <span className="text-xs text-gray-500 self-center">+{conjuntoLegend.size - 8} mais...</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtros */}
          <div className="flex items-center gap-4 p-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar por TAG ou conjunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <select 
              value={filterByConjunto} 
              onChange={(e) => setFilterByConjunto(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todos os conjuntos</option>
              {Array.from(allConjuntos).map(conjunto => (
                <option key={conjunto} value={conjunto}>{conjunto}</option>
              ))}
            </select>
            
            <Button
              variant={showOnlyPending ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyPending(!showOnlyPending)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Apenas Pendentes
            </Button>

            <div className="ml-auto text-sm text-gray-600">
              Peças cortadas: {checkedPieces.size} / {results.bars.reduce((sum, bar) => sum + bar.pieces.length, 0)}
            </div>
          </div>

          {/* Navegação de Barras */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              disabled={selectedBar === 0}
              onClick={() => setSelectedBar(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Barra:</span>
              <select 
                value={selectedBar} 
                onChange={(e) => setSelectedBar(Number(e.target.value))}
                className="px-3 py-1 border rounded"
              >
                {filteredBars.map((_, index) => (
                  <option key={index} value={index}>
                    Barra {filteredBars[index].barIndex + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                de {filteredBars.length}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={selectedBar >= filteredBars.length - 1}
              onClick={() => setSelectedBar(prev => Math.min(filteredBars.length - 1, prev + 1))}
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Conteúdo Principal - com altura fixa e scroll independente */}
          <div className="flex-1 overflow-auto">
            {currentBar && (
              <div className="p-6">
                {/* Informações da Barra */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span>Barra {currentBar.barIndex + 1}</span>
                        
                        {/* Indicadores NOVA/SOBRA */}
                        {(currentBar as any).type === 'leftover' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Recycle className="w-3 h-3 mr-1" />
                            SOBRA
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            NOVA
                          </Badge>
                        )}
                        
                        {/* Localização para sobras */}
                        {(currentBar as any).type === 'leftover' && (currentBar as any).location && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            <MapPin className="w-3 h-3 mr-1" />
                            {(currentBar as any).location}
                          </Badge>
                        )}
                        
                        {/* Economia para sobras */}
                        {(currentBar as any).type === 'leftover' && (currentBar as any).economySaved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Economia: R$ {(currentBar as any).economySaved.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span>Eficiência: {((currentBar.totalUsed / barLength) * 100).toFixed(1)}%</span>
                        <span>Sobra: {(currentBar.waste / 1000).toFixed(3)}m</span>
                        <span>Peças: {currentBar.pieces.length}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Visualização SVG da Barra com zoom independente */}
                    <div className="mb-6" style={{ transform: `scale(${svgZoomLevel})`, transformOrigin: 'top left' }}>
                      <svg width="100%" height="100" viewBox={`0 0 ${barLength / 10} 100`} className="border rounded">
                        {(() => {
                          let currentX = 0;
                          return currentBar.pieces.map((piece: any, pieceIndex) => {
                            const segmentWidth = piece.length / 10;
                            const pieceId = `${currentBar.barIndex}-${piece.tag || piece.length}`;
                            const isChecked = checkedPieces.has(pieceId);
                            
                            // Cor baseada no tipo de barra
                            const segmentColor = (currentBar as any).type === 'leftover' ? '#10B981' : piece.color || colors[pieceIndex % colors.length];
                            
                            const segment = (
                              <g key={pieceIndex}>
                                <rect
                                  x={currentX}
                                  y={30}
                                  width={segmentWidth}
                                  height={40}
                                  fill={isChecked ? '#9CA3AF' : segmentColor}
                                  stroke="#fff"
                                  strokeWidth="2"
                                  opacity={isChecked ? 0.5 : 1}
                                />
                                <text
                                  x={currentX + segmentWidth / 2}
                                  y={55}
                                  textAnchor="middle"
                                  fontSize="8"
                                  fill="white"
                                  fontWeight="bold"
                                >
                                  {piece.tag || (piece.length > 300 ? `${piece.length}` : '')}
                                </text>
                                {isChecked && (
                                  <text
                                    x={currentX + segmentWidth / 2}
                                    y={50}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="white"
                                  >
                                    ✓
                                  </text>
                                )}
                                {/* Indicador de reutilização */}
                                {(currentBar as any).type === 'leftover' && (
                                  <text
                                    x={currentX + segmentWidth / 2}
                                    y={45}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="white"
                                  >
                                    ♻
                                  </text>
                                )}
                              </g>
                            );
                            currentX += segmentWidth;
                            return segment;
                          });
                        })()}
                        
                        {/* Sobra */}
                        {currentBar.waste > 0 && (
                          <rect
                            x={currentBar.totalUsed / 10}
                            y={30}
                            width={currentBar.waste / 10}
                            height={40}
                            fill="#9CA3AF"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        )}
                        
                        {/* Escala */}
                        {Array.from({ length: Math.ceil(barLength / 1000) + 1 }, (_, i) => (
                          <g key={i}>
                            <line
                              x1={i * 100}
                              y1={25}
                              x2={i * 100}
                              y2={75}
                              stroke="#666"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <text
                              x={i * 100}
                              y={20}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#666"
                            >
                              {i}m
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Tabela Detalhada - com scroll independente */}
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead className={`sticky top-0 ${(currentBar as any).type === 'leftover' ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <tr>
                            <th className="border border-gray-300 px-4 py-3 text-left">Status</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Peça</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">TAG</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Comprimento</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Conjunto</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Perfil</th>
                            <th className="border border-gray-300 px-4 py-3 text-left">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBar.pieces.map((piece: any, pieceIndex) => {
                            const pieceId = `${currentBar.barIndex}-${piece.tag || piece.length}`;
                            const isChecked = checkedPieces.has(pieceId);
                            
                            return (
                              <tr key={pieceIndex} className={`hover:bg-gray-50 ${isChecked ? 'bg-green-50' : ''}`}>
                                <td className="border border-gray-300 px-4 py-3">
                                  <Button
                                    variant={isChecked ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => togglePieceCheck(currentBar.barIndex, piece)}
                                  >
                                    {isChecked ? <Check className="w-4 h-4" /> : '□'}
                                  </Button>
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded border" 
                                      style={{ backgroundColor: (currentBar as any).type === 'leftover' ? '#10B981' : piece.color || colors[pieceIndex % colors.length] }}
                                    />
                                    Peça {pieceIndex + 1}
                                    {(currentBar as any).type === 'leftover' && <Recycle className="w-3 h-3 text-green-600" />}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.tag ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {piece.tag}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 font-mono text-lg font-bold">
                                  {piece.length}mm
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.conjunto ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      <Package className="w-3 h-3 mr-1" />
                                      {piece.conjunto}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">Manual</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  {piece.perfil ? (
                                    <Badge variant="secondary">
                                      <Wrench className="w-3 h-3 mr-1" />
                                      {piece.perfil}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-3">
                                  <div className="text-xs text-gray-500">
                                    Pos: {piece.posicao || 'Manual'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Sobra */}
                          {currentBar.waste > 0 && (
                            <tr className="bg-red-50">
                              <td className="border border-gray-300 px-4 py-3">
                                <span className="text-red-600">N/A</span>
                              </td>
                              <td className="border border-gray-300 px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded border bg-gray-300" />
                                  Sobra
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 font-mono text-red-600 font-bold">
                                {currentBar.waste}mm
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">Descarte</td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">
                                {(currentBar as any).type === 'leftover' ? 'Sobra da Sobra' : 'Desperdício'}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-400">Final</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer com atalhos */}
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Atalhos: ESC (sair) | ← → (navegar) | + - (zoom)</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Projeto: {project?.client || 'N/A'}</span>
                <span>Operador: {(project as any)?.operador || 'N/A'}</span>
                <span>Material: {(project as any)?.tipoMaterial || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
