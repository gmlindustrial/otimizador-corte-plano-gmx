/**
 * CuttingWorkflow — Guia visual passo a passo para o operador (G10)
 * Mostra a sequência de cortes com checkbox de progresso.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Scissors, Layers } from 'lucide-react';

interface CutStep {
  id: string;
  barLabel: string;
  position: number; // mm da ponta
  length: number; // comprimento da peça
  tag?: string;
  bundleSize?: number;
}

interface CuttingWorkflowProps {
  bars: Array<{
    id: string;
    pieces: Array<{
      length: number;
      label?: string;
      tag?: string;
    }>;
    waste: number;
    _bundleSize?: number;
    _bundleId?: string;
  }>;
  barLength: number;
}

export const CuttingWorkflow = ({ bars, barLength }: CuttingWorkflowProps) => {
  // Gerar lista de cortes a partir das barras
  const steps: CutStep[] = [];
  let cutLoss = 3; // mm

  bars.forEach((bar, barIndex) => {
    let position = 0;
    bar.pieces.forEach((piece, pieceIndex) => {
      steps.push({
        id: `${bar.id}-${pieceIndex}`,
        barLabel: bar._bundleSize && bar._bundleSize > 1
          ? `Amarrado ${barIndex + 1} (×${bar._bundleSize})`
          : `Barra ${barIndex + 1}`,
        position,
        length: piece.length,
        tag: piece.tag || piece.label,
        bundleSize: bar._bundleSize,
      });
      position += piece.length + cutLoss;
    });
  });

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const completedCount = completedSteps.size;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Sequência de Corte
          </div>
          <Badge variant={completedCount === totalSteps ? 'default' : 'secondary'}>
            {completedCount}/{totalSteps} cortes
          </Badge>
        </CardTitle>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                completedSteps.has(step.id) ? 'bg-accent/50 opacity-60' : 'hover:bg-accent/30'
              }`}
            >
              <Checkbox
                checked={completedSteps.has(step.id)}
                onCheckedChange={() => toggleStep(step.id)}
              />
              <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
              <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={completedSteps.has(step.id) ? 'line-through' : ''}>
                  {step.barLabel} — posição {step.position}mm → cortar {step.length}mm
                </span>
                {step.tag && (
                  <span className="ml-2 text-xs text-muted-foreground">({step.tag})</span>
                )}
              </div>
              {step.bundleSize && step.bundleSize > 1 && (
                <Badge variant="outline" className="text-xs shrink-0">
                  <Layers className="w-3 h-3 mr-1" />
                  ×{step.bundleSize}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
