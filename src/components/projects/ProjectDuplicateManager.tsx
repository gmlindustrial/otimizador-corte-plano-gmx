import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { ProjetoPeca } from '@/types/project';

interface DuplicateItem {
  existing: ProjetoPeca;
  imported: ProjetoPeca;
}

interface ProjectDuplicateManagerProps {
  duplicates: DuplicateItem[];
  onResolved: (selected: ProjetoPeca[]) => void;
  onCancel: () => void;
}

export const ProjectDuplicateManager = ({ duplicates, onResolved, onCancel }: ProjectDuplicateManagerProps) => {
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const toggle = (index: number) => {
    setSelected(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleApply = () => {
    const pieces = duplicates
      .filter((_, idx) => selected[idx])
      .map(d => d.imported);
    onResolved(pieces);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Peças já existentes ({duplicates.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-orange-800">
          Selecione as peças que deseja adicionar mesmo assim.
        </p>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {duplicates.map((dup, index) => (
            <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
              <div>
                <div className="font-medium text-sm">{dup.imported.tag_peca}</div>
                <div className="text-xs text-gray-600">
                  {dup.imported.comprimento_mm}mm × {dup.imported.quantidade}
                </div>
                <div className="text-xs text-gray-500">
                  Já existe: {dup.existing.tag_peca}
                </div>
              </div>
              <Button size="sm" variant={selected[index] ? 'default' : 'outline'} onClick={() => toggle(index)}>
                {selected[index] ? 'Selecionado' : 'Adicionar'}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
