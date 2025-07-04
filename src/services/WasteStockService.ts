
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Project, OptimizationResult } from '@/pages/Index';
import { ProjectService } from './ProjectService';

export class WasteStockService {
  static async addWasteToStock(
    project: Project,
    results: OptimizationResult,
    projectId: string | null
  ): Promise<void> {
    try {
      console.log('=== ADICIONANDO SOBRAS AO ESTOQUE ===');
      console.log('Project:', project);
      console.log('Project ID:', projectId);
      console.log('Material Type:', project.tipoMaterial);

      // Buscar o ID do material baseado no tipo
      const materialId = await ProjectService.getMaterialIdByType(project.tipoMaterial);
      
      console.log('Material ID encontrado:', materialId);

      if (!materialId) {
        console.error('Material ID não encontrado para tipo:', project.tipoMaterial);
        toast.error('Erro: Material não encontrado para salvar sobras');
        return;
      }

      // Filtrar sobras > 50mm e criar entradas para o estoque
      const wasteEntries = results.bars
        .filter(bar => bar.waste > 50)
        .map(bar => ({
          material_id: materialId,
          comprimento: Math.floor(bar.waste),
          localizacao: `Auto-${project.projectNumber}`,
          projeto_origem: projectId,
          quantidade: 1,
          disponivel: true
        }));

      console.log('Sobras para adicionar:', wasteEntries);

      if (wasteEntries.length > 0) {
        const { data, error } = await supabase
          .from('estoque_sobras')
          .insert(wasteEntries)
          .select();

        if (error) {
          console.error('Erro ao inserir sobras:', error);
          throw error;
        }

        console.log('Sobras inseridas com sucesso:', data);
        console.log(`${wasteEntries.length} sobras adicionadas automaticamente ao estoque`);
        toast.success(`${wasteEntries.length} sobras adicionadas ao estoque automaticamente`);
      } else {
        console.log('Nenhuma sobra > 50mm encontrada para adicionar ao estoque');
      }
    } catch (error) {
      console.error('Erro ao adicionar sobras ao estoque:', error);
      toast.error('Erro ao adicionar sobras ao estoque');
    }
  }
}
