/**
 * DxfUpload — Upload de arquivos DXF com drag & drop + seleção manual
 * Preview visual da peça importada via Canvas SVG
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, FileType, X, RotateCcw, Layers, Eye } from 'lucide-react';
import { DxfParserService } from '@/services/DxfParserService';
import { DxfPreview } from './DxfPreview';
import { toast } from 'sonner';
import type { SheetCutPiece } from '@/types/sheet';

interface DxfUploadProps {
  onPiecesImported: (pieces: SheetCutPiece[]) => void;
}

interface ParsedDxfState {
  fileName: string;
  pieces: ReturnType<DxfParserService['parseFile']>;
  sheetPieces: SheetCutPiece[];
}

export const DxfUpload = ({ onPiecesImported }: DxfUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedDxfState | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewPiece, setPreviewPiece] = useState<number | null>(null);

  // Opções de importação
  const [quantity, setQuantity] = useState(1);
  const [allowRotation, setAllowRotation] = useState(true);
  const [thickness, setThickness] = useState<number>(0);
  const [material, setMaterial] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parserService = useRef(new DxfParserService());

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      toast.error('Formato inválido. Selecione um arquivo .dxf');
      return;
    }

    setLoading(true);
    try {
      const content = await file.text();
      const parsedPieces = parserService.current.parseFile(content);
      const sheetPieces = parserService.current.toSheetCutPieces(parsedPieces, {
        quantity,
        allowRotation,
        thickness: thickness > 0 ? thickness : undefined,
        material: material || undefined,
        fileName: file.name,
      });

      setParsed({
        fileName: file.name,
        pieces: parsedPieces,
        sheetPieces,
      });
      setPreviewPiece(0);

      toast.success(`${parsedPieces.length} peça(s) encontrada(s) em ${file.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar arquivo DXF');
      console.error('Erro DXF:', error);
    } finally {
      setLoading(false);
    }
  }, [quantity, allowRotation, thickness, material]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (!parsed) return;

    // Atualizar quantidade e rotação nas peças
    const updatedPieces = parsed.sheetPieces.map(p => ({
      ...p,
      quantity,
      allowRotation,
      thickness: thickness > 0 ? thickness : p.thickness,
      material: material || p.material,
    }));

    onPiecesImported(updatedPieces);
    toast.success(`${updatedPieces.length} peça(s) importada(s) com sucesso`);
  };

  const handleClear = () => {
    setParsed(null);
    setPreviewPiece(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileType className="w-4 h-4 text-primary" />
          Importar Peça DXF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zona de upload drag & drop */}
        {!parsed && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center w-full h-40
              border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/30'}
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground text-center px-4">
              {loading ? 'Processando arquivo...' : (
                <>
                  <span className="font-medium">Arraste o arquivo DXF aqui</span>
                  <br />
                  ou clique para selecionar
                </>
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".dxf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview e opções após upload */}
        {parsed && (
          <>
            {/* Header do arquivo */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{parsed.fileName}</span>
                <Badge variant="outline" className="text-xs">{parsed.pieces.length} peça(s)</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClear} className="h-7 w-7">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview visual */}
            {previewPiece !== null && parsed.pieces[previewPiece] && (
              <DxfPreview piece={parsed.pieces[previewPiece]} />
            )}

            {/* Seletor de peças se >1 */}
            {parsed.pieces.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {parsed.pieces.map((_, idx) => (
                  <Button
                    key={idx}
                    variant={previewPiece === idx ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewPiece(idx)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Peça {idx + 1}
                  </Button>
                ))}
              </div>
            )}

            {/* Info da peça selecionada */}
            {previewPiece !== null && parsed.pieces[previewPiece] && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-2 bg-secondary rounded text-center">
                  <p className="text-xs text-muted-foreground">Largura</p>
                  <p className="font-medium">{parsed.pieces[previewPiece].boundingBox.width.toFixed(1)}mm</p>
                </div>
                <div className="p-2 bg-secondary rounded text-center">
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="font-medium">{parsed.pieces[previewPiece].boundingBox.height.toFixed(1)}mm</p>
                </div>
                <div className="p-2 bg-secondary rounded text-center">
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="font-medium">{(parsed.pieces[previewPiece].area / 1000000).toFixed(3)}m²</p>
                </div>
                <div className="p-2 bg-secondary rounded text-center">
                  <p className="text-xs text-muted-foreground">Furos</p>
                  <p className="font-medium">{parsed.pieces[previewPiece].holes.length}</p>
                </div>
              </div>
            )}

            {/* Opções de importação */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Espessura (mm)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={thickness}
                  onChange={(e) => setThickness(Number(e.target.value))}
                  placeholder="Ex: 6.35"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Material</Label>
                <Input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ex: A36"
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={allowRotation}
                    onCheckedChange={setAllowRotation}
                    id="rotation"
                  />
                  <Label htmlFor="rotation" className="text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Rotação 90°
                  </Label>
                </div>
              </div>
            </div>

            {/* Botão confirmar */}
            <Button onClick={handleConfirm} className="w-full">
              <Layers className="w-4 h-4 mr-2" />
              Importar {parsed.pieces.length} peça(s) × {quantity}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
