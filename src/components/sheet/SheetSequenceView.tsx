
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, SkipForward, SkipBack, Download, Settings } from 'lucide-react';

interface CutPoint {
  x: number;
  y: number;
  piece: any;
  type: 'entry' | 'start' | 'end';
  order: number;
}

interface SheetSequenceViewProps {
  cuttingSequence: {
    points: CutPoint[];
    totalDistance: number;
    piercePoints: number;
  } | null;
  sheetDimensions: { width: number; height: number; };
  pieces: any[];
}

export const SheetSequenceView = ({ 
  cuttingSequence, 
  sheetDimensions, 
  pieces 
}: SheetSequenceViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(500); // ms per step
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showPiercePoints, setShowPiercePoints] = useState(true);
  const [playbackMode, setPlaybackMode] = useState<'sequence' | 'pieces'>('sequence');

  useEffect(() => {
    drawSequence();
  }, [cuttingSequence, currentStep, showTrajectory, showPiercePoints, playbackMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && cuttingSequence) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          const maxSteps = playbackMode === 'sequence' 
            ? cuttingSequence.points.length 
            : pieces.length;
          
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return maxSteps - 1;
          }
          return prev + 1;
        });
      }, animationSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, animationSpeed, cuttingSequence, playbackMode, pieces]);

  const drawSequence = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cuttingSequence) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const scale = Math.min(
      (canvas.width - padding * 2) / sheetDimensions.width,
      (canvas.height - padding * 2) / sheetDimensions.height
    );

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(padding, padding);

    // Desenhar borda da chapa
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, sheetDimensions.width * scale, sheetDimensions.height * scale);

    // Desenhar peças (fundo)
    pieces.forEach((piece, index) => {
      const isCurrentPiece = playbackMode === 'pieces' && index === currentStep;
      const isCompletedPiece = playbackMode === 'pieces' && index < currentStep;
      
      ctx.fillStyle = isCurrentPiece 
        ? 'rgba(59, 130, 246, 0.3)' 
        : isCompletedPiece 
        ? 'rgba(34, 197, 94, 0.2)' 
        : 'rgba(229, 231, 235, 0.5)';
        
      ctx.fillRect(
        piece.x * scale,
        piece.y * scale,
        piece.width * scale,
        piece.height * scale
      );
      
      ctx.strokeStyle = isCurrentPiece ? '#3b82f6' : '#9ca3af';
      ctx.lineWidth = isCurrentPiece ? 2 : 1;
      ctx.strokeRect(
        piece.x * scale,
        piece.y * scale,
        piece.width * scale,
        piece.height * scale
      );

      // Tag da peça
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        piece.tag,
        (piece.x + piece.width / 2) * scale,
        (piece.y + piece.height / 2) * scale
      );
    });

    if (playbackMode === 'sequence') {
      // Desenhar trajetória completa (opcional)
      if (showTrajectory) {
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        
        cuttingSequence.points.forEach((point, index) => {
          const x = point.x * scale;
          const y = point.y * scale;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Desenhar sequência até o passo atual
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const pointsToShow = cuttingSequence.points.slice(0, currentStep + 1);
      
      pointsToShow.forEach((point, index) => {
        const x = point.x * scale;
        const y = point.y * scale;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Desenhar pontos
      pointsToShow.forEach((point, index) => {
        const x = point.x * scale;
        const y = point.y * scale;
        
        // Ponto de perfuração
        if (point.type === 'entry' && showPiercePoints) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Anel de perfuração
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // Ponto atual
        if (index === currentStep) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();
          
          // Halo do ponto atual
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // Números dos pontos
        if (point.type === 'entry') {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            (index + 1).toString(),
            x,
            y + 3
          );
        }
      });

      // Seta de direção
      if (currentStep > 0 && currentStep < cuttingSequence.points.length) {
        const prevPoint = cuttingSequence.points[currentStep - 1];
        const currentPoint = cuttingSequence.points[currentStep];
        
        const dx = currentPoint.x - prevPoint.x;
        const dy = currentPoint.y - prevPoint.y;
        const angle = Math.atan2(dy, dx);
        
        const arrowX = currentPoint.x * scale;
        const arrowY = currentPoint.y * scale;
        
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    }

    ctx.restore();

    // Informações do passo atual
    if (currentStep < cuttingSequence.points.length) {
      const currentPoint = cuttingSequence.points[currentStep];
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      
      const info = [
        `Passo: ${currentStep + 1}/${cuttingSequence.points.length}`,
        `Tipo: ${currentPoint.type === 'entry' ? 'Perfuração' : currentPoint.type === 'start' ? 'Início' : 'Fim'}`,
        `Peça: ${currentPoint.piece.tag}`,
        `Posição: (${currentPoint.x.toFixed(1)}, ${currentPoint.y.toFixed(1)})mm`
      ];
      
      info.forEach((line, index) => {
        ctx.fillText(line, 10, 20 + index * 18);
      });
    }
  };

  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  const handleStepForward = () => {
    if (!cuttingSequence) return;
    const maxSteps = playbackMode === 'sequence' 
      ? cuttingSequence.points.length 
      : pieces.length;
    setCurrentStep(prev => Math.min(prev + 1, maxSteps - 1));
  };
  const handleStepBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const exportGCode = () => {
    if (!cuttingSequence) return;
    
    const gcode = [
      'G21 ; Unidades em milímetros',
      'G90 ; Coordenadas absolutas',
      'M03 ; Ligar plasma/oxicorte',
      '',
      ...cuttingSequence.points.map((point, index) => {
        switch (point.type) {
          case 'entry':
            return [
              `; Perfuração ${index + 1} - Peça ${point.piece.tag}`,
              `G00 X${point.x.toFixed(2)} Y${point.y.toFixed(2)}`,
              'M07 ; Iniciar perfuração',
              'G04 P0.5'
            ].join('\n');
          case 'start':
            return `G01 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} ; Início corte ${point.piece.tag}`;
          case 'end':
            return [
              `G01 X${point.x.toFixed(2)} Y${point.y.toFixed(2)} ; Fim corte ${point.piece.tag}`,
              'M08 ; Parar perfuração',
              ''
            ].join('\n');
          default:
            return '';
        }
      }),
      '',
      'M05 ; Desligar plasma/oxicorte',
      'G00 X0 Y0 ; Retornar origem',
      'M30 ; Fim programa'
    ].join('\n');

    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequencia-corte.gcode';
    a.click();
  };

  if (!cuttingSequence) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6 text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Nenhuma sequência de corte disponível</p>
          <p className="text-sm">Execute uma otimização primeiro</p>
        </CardContent>
      </Card>
    );
  }

  const maxSteps = playbackMode === 'sequence' 
    ? cuttingSequence.points.length 
    : pieces.length;
  const progress = ((currentStep + 1) / maxSteps) * 100;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Sequência de Corte Otimizada
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Controles de Reprodução */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleStepBack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handlePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleStepForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Square className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm">Modo:</label>
              <Select value={playbackMode} onValueChange={(value: any) => setPlaybackMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Sequência</SelectItem>
                  <SelectItem value="pieces">Por Peça</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={exportGCode}>
              <Download className="w-4 h-4 mr-2" />
              G-Code
            </Button>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso: {currentStep + 1}/{maxSteps}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Configurações de Visualização */}
        <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTrajectory}
              onChange={(e) => setShowTrajectory(e.target.checked)}
            />
            <label className="text-sm">Mostrar Trajetória</label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPiercePoints}
              onChange={(e) => setShowPiercePoints(e.target.checked)}
            />
            <label className="text-sm">Pontos de Perfuração</label>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Velocidade:</label>
            <Slider
              value={[2000 - animationSpeed]}
              onValueChange={([value]) => setAnimationSpeed(2000 - value)}
              min={100}
              max={1800}
              step={100}
              className="w-24"
            />
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

        {/* Informações da Sequência */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-medium text-blue-900">Distância Total</div>
            <div className="text-xl font-bold text-blue-600">
              {(cuttingSequence.totalDistance / 1000).toFixed(2)} m
            </div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="font-medium text-red-900">Perfurações</div>
            <div className="text-xl font-bold text-red-600">
              {cuttingSequence.piercePoints}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-medium text-green-900">Tempo Estimado</div>
            <div className="text-xl font-bold text-green-600">
              {((cuttingSequence.totalDistance / 2000) + (cuttingSequence.piercePoints * 0.5)).toFixed(1)} min
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-2">Legenda:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Pontos de Perfuração</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Trajetória de Corte</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Posição Atual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Peças Concluídas</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
