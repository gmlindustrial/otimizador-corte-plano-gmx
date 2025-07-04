import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Project, OptimizationResult, CutPiece } from '@/pages/Index';

export interface OptimizationHistoryEntry {
  id: string;
  project: Project;
  pieces: CutPiece[];
  results: OptimizationResult;
  date: string;
  barLength: number;
}

export const useOptimizationHistoryPersistent = () => {
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_otimizacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedHistory = data.map(convertFromDatabase).filter(Boolean) as OptimizationHistoryEntry[];
      setOptimizationHistory(convertedHistory);
      
      console.log('Histórico carregado do Supabase:', convertedHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de otimizações');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = async (
    project: Project,
    pieces: CutPiece[],
    results: OptimizationResult,
    barLength: number
  ) => {
    try {
      // Primeiro, salvar o projeto se ainda não existir no Supabase
      let savedProjectId = null;
      
      try {
        const { data: existingProject, error: projectError } = await supabase
          .from('projetos')
          .select('id')
          .eq('numero_projeto', project.projectNumber)
          .maybeSingle();

        if (!projectError && existingProject) {
          savedProjectId = existingProject.id;
        } else {
          // Preparar dados do projeto com conversão explícita para JSON
          const projectData = {
            barLength,
            pieces: pieces as any, // Forçar conversão para JSON
            results: results as any // Forçar conversão para JSON
          };

          // Salvar projeto no Supabase
          const { data: newProject, error: createError } = await supabase
            .from('projetos')
            .insert({
              nome: project.name, // Usar 'nome' que é o campo correto na tabela
              numero_projeto: project.projectNumber,
              cliente_id: await getClienteIdByName(project.client),
              obra_id: await getObraIdByName(project.obra),
              material_id: await getMaterialIdByType(project.tipoMaterial),
              operador_id: await getOperadorIdByName(project.operador),
              inspetor_id: await getInspetorIdByName(project.aprovadorQA),
              lista: project.lista,
              revisao: project.revisao,
              turno: project.turno,
              validacao_qa: project.validacaoQA,
              enviar_sobras_estoque: project.enviarSobrasEstoque,
              qr_code: project.qrCode,
              dados_projeto: projectData as any
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Erro ao salvar projeto:', createError);
          } else {
            savedProjectId = newProject.id;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar/salvar projeto:', error);
      }

      const historyData = {
        projeto_id: savedProjectId,
        bar_length: barLength,
        pecas: pieces as any,
        resultados: results as any
      };

      const { data, error } = await supabase
        .from('historico_otimizacoes')
        .insert(historyData)
        .select()
        .single();

      if (error) throw error;

      const newEntry: OptimizationHistoryEntry = {
        id: data.id,
        project,
        pieces: [...pieces],
        results,
        date: data.created_at,
        barLength
      };

      setOptimizationHistory(prev => [newEntry, ...prev]);

      // Auto-enviar sobras para estoque se habilitado
      if (project.enviarSobrasEstoque && results.totalWaste > 0) {
        await addWasteToStock(project, results, savedProjectId);
      }

      console.log('Otimização salva no histórico:', newEntry);
      toast.success('Otimização salva no histórico');

    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
      toast.error('Erro ao salvar otimização no histórico');
    }
  };

  const addWasteToStock = async (project: Project, results: OptimizationResult, projectId: string | null) => {
    try {
      console.log('=== ADICIONANDO SOBRAS AO ESTOQUE ===');
      console.log('Project:', project);
      console.log('Project ID:', projectId);
      console.log('Material Type:', project.tipoMaterial);

      // Buscar o ID do material baseado no tipo
      const materialId = await getMaterialIdByType(project.tipoMaterial);
      
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
  };

  const getClienteIdByName = async (clienteName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('nome', clienteName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  };

  const getObraIdByName = async (obraName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id')
        .eq('nome', obraName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar obra:', error);
      return null;
    }
  };

  const getMaterialIdByType = async (materialType: string): Promise<string | null> => {
    try {
      console.log('Buscando material por tipo:', materialType);
      
      // Se materialType já é um UUID, retorná-lo
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(materialType);
      if (isUUID) {
        return materialType;
      }

      const { data, error } = await supabase
        .from('materiais')
        .select('id')
        .eq('tipo', materialType)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar material:', error);
        return null;
      }

      console.log('Material encontrado:', data);
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar material:', error);
      return null;
    }
  };

  const getOperadorIdByName = async (operadorName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id')
        .eq('nome', operadorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar operador:', error);
      return null;
    }
  };

  const getInspetorIdByName = async (inspetorName: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('inspetores_qa')
        .select('id')
        .eq('nome', inspetorName)
        .maybeSingle();
      
      return error ? null : data?.id || null;
    } catch (error) {
      console.error('Erro ao buscar inspetor:', error);
      return null;
    }
  };

  const convertFromDatabase = (dbEntry: any): OptimizationHistoryEntry | null => {
    try {
      return {
        id: dbEntry.id,
        project: dbEntry.projeto_data || {
          id: 'temp-' + dbEntry.id,
          name: 'Projeto Carregado',
          projectNumber: 'TEMP-001',
          client: 'Cliente',
          obra: 'Obra',
          lista: 'LISTA 01',
          revisao: 'REV-00',
          tipoMaterial: 'Material',
          operador: 'Operador',
          turno: '1',
          aprovadorQA: 'QA',
          validacaoQA: true,
          enviarSobrasEstoque: false,
          qrCode: '',
          date: dbEntry.created_at
        },
        pieces: dbEntry.pecas || [],
        results: dbEntry.resultados || { bars: [], totalBars: 0, totalWaste: 0, wastePercentage: 0, efficiency: 0 },
        date: dbEntry.created_at,
        barLength: dbEntry.bar_length || 6000
      };
    } catch (error) {
      console.error('Erro ao converter entrada do histórico:', error);
      return null;
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('historico_otimizacoes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setOptimizationHistory([]);
      toast.success('Histórico limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast.error('Erro ao limpar histórico');
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historico_otimizacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOptimizationHistory(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entrada removida do histórico');
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      toast.error('Erro ao remover do histórico');
    }
  };

  const getHistoryStats = () => {
    if (optimizationHistory.length === 0) {
      return {
        totalOptimizations: 0,
        averageEfficiency: 0,
        totalMaterialSaved: 0,
        bestEfficiency: 0
      };
    }

    const totalOptimizations = optimizationHistory.length;
    const averageEfficiency = optimizationHistory.reduce((sum, entry) => sum + entry.results.efficiency, 0) / totalOptimizations;
    const totalMaterialSaved = optimizationHistory.reduce((sum, entry) => sum + entry.results.totalWaste, 0);
    const bestEfficiency = Math.max(...optimizationHistory.map(entry => entry.results.efficiency));

    return {
      totalOptimizations,
      averageEfficiency,
      totalMaterialSaved,
      bestEfficiency
    };
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    optimizationHistory,
    loading,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getHistoryStats,
    loadHistory
  };
};
