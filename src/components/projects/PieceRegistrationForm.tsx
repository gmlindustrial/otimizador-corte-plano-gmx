import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { projetoPecaService } from '@/services/entities/ProjetoPecaService';
import { perfilService } from '@/services/entities/PerfilService';
import type { ProjetoPeca } from '@/types/project';
import { toast } from 'sonner';

interface PieceRegistrationFormProps {
  projectId: string;
  onPieceAdded: (piece: ProjetoPeca) => void;
}

export const PieceRegistrationForm = ({ projectId, onPieceAdded }: PieceRegistrationFormProps) => {
  const [formData, setFormData] = useState({
    posicao: '',
    tag: '',
    descricao_perfil: '',
    comprimento_mm: '',
    quantidade: '1'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.posicao || !formData.descricao_perfil || !formData.comprimento_mm) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Buscar perfil correspondente
      const perfil = await perfilService.findBestMatch(formData.descricao_perfil);
      
      const newPiece = {
        projeto_id: projectId,
        posicao: formData.posicao,
        tag: formData.tag || undefined,
        perfil_id: perfil?.id,
        descricao_perfil_raw: formData.descricao_perfil,
        comprimento_mm: parseInt(formData.comprimento_mm),
        quantidade: parseInt(formData.quantidade),
        peso_por_metro: perfil?.kg_por_metro,
        perfil_nao_encontrado: !perfil
      };

      const response = await projetoPecaService.create(newPiece);
      
      if (response.success && response.data) {
        onPieceAdded(response.data);
        setFormData({
          posicao: '',
          tag: '',
          descricao_perfil: '',
          comprimento_mm: '',
          quantidade: '1'
        });
        
        if (!perfil) {
          toast.warning('Peça cadastrada, mas perfil não encontrado na base de dados');
        } else {
          toast.success('Peça cadastrada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar peça:', error);
      toast.error('Erro ao cadastrar peça');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="posicao">Posição *</Label>
        <Input
          id="posicao"
          value={formData.posicao}
          onChange={(e) => setFormData(prev => ({ ...prev, posicao: e.target.value }))}
          placeholder="Ex: P01, V1, C123"
        />
      </div>

      <div>
        <Label htmlFor="tag">Tag</Label>
        <Input
          id="tag"
          value={formData.tag}
          onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
          placeholder="Ex: V01, C02"
        />
      </div>

      <div>
        <Label htmlFor="descricao_perfil">Descrição do Perfil *</Label>
        <Input
          id="descricao_perfil"
          value={formData.descricao_perfil}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao_perfil: e.target.value }))}
          placeholder="Ex: Cantoneira L 2&quot;x1/4&quot;"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="comprimento_mm">Comprimento (mm) *</Label>
          <Input
            id="comprimento_mm"
            type="number"
            value={formData.comprimento_mm}
            onChange={(e) => setFormData(prev => ({ ...prev, comprimento_mm: e.target.value }))}
            placeholder="Ex: 2500"
          />
        </div>

        <div>
          <Label htmlFor="quantidade">Quantidade *</Label>
          <Input
            id="quantidade"
            type="number"
            value={formData.quantidade}
            onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
            min="1"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Cadastrando...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Peça
          </>
        )}
      </Button>
    </form>
  );
};