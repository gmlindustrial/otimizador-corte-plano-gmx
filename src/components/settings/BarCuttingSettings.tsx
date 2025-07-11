
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calculator, Save, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BarCuttingConfig {
  cutLoss: number;
  algorithm: 'FFD' | 'BFD' | 'NextFit';
  allowWaste: boolean;
  maxWastePercentage: number;
  minPieceLength: number;
}

interface TamanhoBarra {
  id: string;
  comprimento: number;
  descricao?: string;
  is_default: boolean;
}

export const BarCuttingSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BarCuttingConfig>({
    cutLoss: 3,
    algorithm: 'FFD',
    allowWaste: true,
    maxWastePercentage: 15,
    minPieceLength: 50
  });
  
  const [tamanhos, setTamanhos] = useState<TamanhoBarra[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTamanho, setEditingTamanho] = useState<TamanhoBarra | null>(null);
  const [formData, setFormData] = useState({
    comprimento: 6000,
    descricao: '',
    is_default: false
  });

  useEffect(() => {
    fetchTamanhos();
    // Carregar configurações do localStorage
    const savedConfig = localStorage.getItem('barCuttingConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const fetchTamanhos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tamanhos_barras')
        .select('*')
        .order('comprimento', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tamanhos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tamanhos de barras.",
          variant: "destructive",
        });
      } else {
        setTamanhos(data || []);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('barCuttingConfig', JSON.stringify(config));
    toast({
      title: "Configurações Salvas",
      description: "Configurações de corte linear foram atualizadas com sucesso.",
    });
  };

  const handleSubmitTamanho = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Se estiver marcando como padrão, primeiro desmarcar outros padrões
      if (formData.is_default) {
        await supabase
          .from('tamanhos_barras')
          .update({ is_default: false })
          .neq('id', editingTamanho?.id || '');
      }

      if (editingTamanho) {
        const { error } = await supabase
          .from('tamanhos_barras')
          .update({
            comprimento: formData.comprimento,
            descricao: formData.descricao || null,
            is_default: formData.is_default
          })
          .eq('id', editingTamanho.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tamanho atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('tamanhos_barras')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Tamanho adicionado com sucesso!",
        });
      }

      await fetchTamanhos();
      resetForm();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar tamanho:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar tamanho.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tamanho?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tamanhos_barras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Tamanho excluído com sucesso!",
      });
      
      await fetchTamanhos();
    } catch (error: any) {
      console.error('Erro ao excluir tamanho:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir tamanho.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tamanho: TamanhoBarra) => {
    setEditingTamanho(tamanho);
    setFormData({
      comprimento: tamanho.comprimento,
      descricao: tamanho.descricao || '',
      is_default: tamanho.is_default
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTamanho(null);
    setFormData({
      comprimento: 6000,
      descricao: '',
      is_default: false
    });
  };

  const generateReport = () => {
    toast({
      title: "Relatório Gerado",
      description: "Abrindo relatório de barras cadastradas...",
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Configurações de Corte Linear (Barras)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configurações de Corte</h3>
            
            <div className="space-y-2">
              <Label htmlFor="cutLoss">Perda por Corte (mm)</Label>
              <Input
                id="cutLoss"
                type="number"
                value={config.cutLoss}
                onChange={(e) => setConfig(prev => ({ ...prev, cutLoss: parseFloat(e.target.value) }))}
                min={0}
                step={0.1}
              />
              <p className="text-xs text-gray-500">Material perdido a cada corte realizado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPieceLength">Comprimento Mínimo da Peça (mm)</Label>
              <Input
                id="minPieceLength"
                type="number"
                value={config.minPieceLength}
                onChange={(e) => setConfig(prev => ({ ...prev, minPieceLength: parseInt(e.target.value) }))}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Algoritmo de Otimização</h3>
            
            <div className="space-y-2">
              <Label htmlFor="algorithm">Algoritmo</Label>
              <Select value={config.algorithm} onValueChange={(value: 'FFD' | 'BFD' | 'NextFit') => setConfig(prev => ({ ...prev, algorithm: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FFD">First Fit Decreasing (FFD)</SelectItem>
                  <SelectItem value="BFD">Best Fit Decreasing (BFD)</SelectItem>
                  <SelectItem value="NextFit">Next Fit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWaste">Desperdício Máximo Permitido (%)</Label>
              <Input
                id="maxWaste"
                type="number"
                value={config.maxWastePercentage}
                onChange={(e) => setConfig(prev => ({ ...prev, maxWastePercentage: parseFloat(e.target.value) }))}
                min={0}
                max={100}
                step={0.1}
              />
              <p className="text-xs text-gray-500">Percentual máximo de desperdício aceitável</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tamanhos de Barras Disponíveis</h3>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Tamanho
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTamanho ? "Editar Tamanho" : "Novo Tamanho"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitTamanho} className="space-y-4">
                  <div>
                    <Label htmlFor="comprimento">Comprimento (mm) *</Label>
                    <Input
                      id="comprimento"
                      type="number"
                      value={formData.comprimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, comprimento: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Ex: Barra padrão 6m"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_default">Marcar como tamanho padrão</Label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="flex-1">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Salvando..." : (editingTamanho ? "Atualizar" : "Criar")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Os tamanhos cadastrados aqui aparecerão como opções na interface de otimização. 
              O tamanho marcado como "padrão" será selecionado automaticamente.
            </p>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprimento (mm)</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Carregando tamanhos...
                    </TableCell>
                  </TableRow>
                ) : tamanhos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Nenhum tamanho cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  tamanhos.map((tamanho) => (
                    <TableRow key={tamanho.id}>
                      <TableCell className="font-medium">{tamanho.comprimento.toLocaleString()}mm</TableCell>
                      <TableCell>{tamanho.descricao || "-"}</TableCell>
                      <TableCell>
                        {tamanho.is_default ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Padrão
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Disponível
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tamanho)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tamanho.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Configurações Atuais</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700">Algoritmo:</p>
              <p className="text-gray-900">{config.algorithm === 'FFD' ? 'First Fit Decreasing' : config.algorithm === 'BFD' ? 'Best Fit Decreasing' : 'Next Fit'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700">Perda por Corte:</p>
              <p className="text-gray-900">{config.cutLoss}mm</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700">Desperdício Máximo:</p>
              <p className="text-gray-900">{config.maxWastePercentage}%</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button 
            onClick={generateReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Relatório de Configurações
          </Button>
          
          <Button 
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
