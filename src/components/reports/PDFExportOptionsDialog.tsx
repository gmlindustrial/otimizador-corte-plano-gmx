import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';
import type { PDFExportOptions, PDFTableColumn } from '@/types/pdfExport';
import { DEFAULT_PDF_COLUMNS, DEFAULT_PDF_EXPORT_OPTIONS } from '@/types/pdfExport';

interface PDFExportOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions) => void;
}

export const PDFExportOptionsDialog = ({
  isOpen,
  onClose,
  onExport,
}: PDFExportOptionsDialogProps) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    DEFAULT_PDF_EXPORT_OPTIONS.orientation
  );
  const [fontSize, setFontSize] = useState<number>(DEFAULT_PDF_EXPORT_OPTIONS.fontSize);
  const [columns, setColumns] = useState<PDFTableColumn[]>(
    DEFAULT_PDF_COLUMNS.map(col => ({ ...col }))
  );
  const [truncatePosition, setTruncatePosition] = useState<boolean>(
    DEFAULT_PDF_EXPORT_OPTIONS.truncatePosition
  );
  const [positionTruncateLength, setPositionTruncateLength] = useState<number>(
    DEFAULT_PDF_EXPORT_OPTIONS.positionTruncateLength
  );

  const handleColumnToggle = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, enabled: !col.enabled } : col
      )
    );
  };

  const handleExport = () => {
    const options: PDFExportOptions = {
      orientation,
      fontSize,
      columns,
      truncatePosition,
      positionTruncateLength,
    };
    onExport(options);
    onClose();
  };

  const enabledColumnsCount = columns.filter(c => c.enabled).length;
  const totalWidth = columns
    .filter(c => c.enabled)
    .reduce((sum, col) => sum + col.width, 0);
  const maxWidth = orientation === 'landscape' ? 257 : 170; // A4 margins

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Opções de Exportação PDF
          </DialogTitle>
          <DialogDescription>
            Configure as opções do PDF antes de exportar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Orientação e Fonte */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orientação</Label>
              <Select
                value={orientation}
                onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="landscape">Paisagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Select
                value={fontSize.toString()}
                onValueChange={(value) => setFontSize(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6pt (Muito pequeno)</SelectItem>
                  <SelectItem value="7">7pt (Pequeno)</SelectItem>
                  <SelectItem value="8">8pt (Normal)</SelectItem>
                  <SelectItem value="9">9pt (Grande)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Truncar Posição */}
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <Label>Truncar Posição Longa</Label>
                <p className="text-xs text-gray-500">
                  Mostra apenas os últimos caracteres da posição
                </p>
              </div>
              <Switch
                checked={truncatePosition}
                onCheckedChange={setTruncatePosition}
              />
            </div>

            {truncatePosition && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Caracteres:</Label>
                <Input
                  type="number"
                  min={3}
                  max={20}
                  value={positionTruncateLength}
                  onChange={(e) => setPositionTruncateLength(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-gray-500">
                  Ex: MB-USB-HTM1-001-1002 → {positionTruncateLength > 0 ? "MB-USB-HTM1-001-1002".slice(-positionTruncateLength) : ""}
                </span>
              </div>
            )}
          </div>

          {/* Seleção de Colunas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Colunas ({enabledColumnsCount} selecionadas)</Label>
              <span className={`text-xs ${totalWidth > maxWidth ? 'text-red-500' : 'text-gray-500'}`}>
                Largura: {totalWidth}mm / {maxWidth}mm
              </span>
            </div>

            {totalWidth > maxWidth && (
              <p className="text-xs text-red-500">
                Largura excede o limite. Considere usar orientação Paisagem ou remover colunas.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${column.id}`}
                    checked={column.enabled}
                    onCheckedChange={() => handleColumnToggle(column.id)}
                  />
                  <Label
                    htmlFor={`col-${column.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {column.header}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
