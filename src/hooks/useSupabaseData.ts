import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseData = () => {
  const [obras, setObras] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [inspetores, setInspetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      console.log('Carregando dados do Supabase...');
      
      const [obrasRes, clientesRes, materiaisRes, operadoresRes, inspetoresRes] = await Promise.all([
        supabase.from('obras').select('*').order('created_at', { ascending: false }),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        supabase.from('materiais').select('*').order('created_at', { ascending: false }),
        supabase.from('operadores').select('*').order('created_at', { ascending: false }),
        supabase.from('inspetores_qa').select('*').order('created_at', { ascending: false })
      ]);

      if (obrasRes.error) {
        console.error('Erro ao carregar obras:', obrasRes.error);
        throw obrasRes.error;
      }
      if (clientesRes.error) {
        console.error('Erro ao carregar clientes:', clientesRes.error);
        throw clientesRes.error;
      }
      if (materiaisRes.error) {
        console.error('Erro ao carregar materiais:', materiaisRes.error);
        throw materiaisRes.error;
      }
      if (operadoresRes.error) {
        console.error('Erro ao carregar operadores:', operadoresRes.error);
        throw operadoresRes.error;
      }
      if (inspetoresRes.error) {
        console.error('Erro ao carregar inspetores:', inspetoresRes.error);
        throw inspetoresRes.error;
      }

      console.log('Dados carregados:', {
        obras: obrasRes.data?.length,
        clientes: clientesRes.data?.length,
        materiais: materiaisRes.data?.length,
        operadores: operadoresRes.data?.length,
        inspetores: inspetoresRes.data?.length
      });

      setObras(obrasRes.data || []);
      setClientes(clientesRes.data || []);
      setMateriais(materiaisRes.data || []);
      setOperadores(operadoresRes.data || []);
      setInspetores(inspetoresRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const saveObra = async (obra: { nome: string; endereco: string; responsavel: string }) => {
    try {
      console.log('=== INICIANDO SALVAMENTO DA OBRA ===');
      console.log('Dados da obra a serem salvos:', obra);
      
      // Validação básica
      if (!obra.nome || obra.nome.trim() === '') {
        console.error('Nome da obra é obrigatório');
        toast.error('Nome da obra é obrigatório');
        throw new Error('Nome da obra é obrigatório');
      }

      console.log('Fazendo chamada para o Supabase...');
      const { data, error } = await supabase
        .from('obras')
        .insert([{
          nome: obra.nome.trim(),
          endereco: obra.endereco?.trim() || null,
          responsavel: obra.responsavel?.trim() || null
        }])
        .select()
        .single();

      console.log('Resposta do Supabase:', { data, error });

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        toast.error(`Erro ao salvar obra: ${error.message}`);
        throw error;
      }
      
      if (!data) {
        console.error('Nenhum dado retornado pelo Supabase');
        toast.error('Erro: nenhum dado retornado ao salvar obra');
        throw new Error('Nenhum dado retornado');
      }

      console.log('Obra salva com sucesso:', data);
      setObras(prev => {
        const updated = [data, ...prev];
        console.log('Lista de obras atualizada. Total:', updated.length);
        return updated;
      });
      
      toast.success(`Obra "${obra.nome}" criada com sucesso!`);
      console.log('=== SALVAMENTO DA OBRA CONCLUÍDO ===');
      return data;
    } catch (error: any) {
      console.error('=== ERRO NO SALVAMENTO DA OBRA ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      console.error('Stack trace:', error?.stack);
      toast.error(`Erro ao salvar obra: ${error?.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const saveCliente = async (cliente: { nome: string; contato: string; email: string; telefone: string }) => {
    try {
      console.log('Salvando cliente:', cliente);
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar cliente:', error);
        throw error;
      }
      
      console.log('Cliente salvo:', data);
      setClientes(prev => {
        const updated = [data, ...prev];
        console.log('Lista de clientes atualizada:', updated.length);
        return updated;
      });
      toast.success(`Cliente "${cliente.nome}" criado com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
      throw error;
    }
  };

  const saveMaterial = async (material: { tipo: string; descricao: string; comprimentoPadrao: number }) => {
    try {
      console.log('Salvando material:', material);
      const { data, error } = await supabase
        .from('materiais')
        .insert([{
          tipo: material.tipo,
          descricao: material.descricao,
          comprimento_padrao: material.comprimentoPadrao
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar material:', error);
        throw error;
      }
      
      console.log('Material salvo:', data);
      setMateriais(prev => {
        const updated = [data, ...prev];
        console.log('Lista de materiais atualizada:', updated.length);
        return updated;
      });
      toast.success(`Material "${material.tipo}" criado com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      toast.error('Erro ao salvar material');
      throw error;
    }
  };

  const saveOperador = async (operador: { nome: string; turno: string; especialidade: string }) => {
    try {
      console.log('Salvando operador:', operador);
      const { data, error } = await supabase
        .from('operadores')
        .insert([operador])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar operador:', error);
        throw error;
      }
      
      console.log('Operador salvo:', data);
      setOperadores(prev => {
        const updated = [data, ...prev];
        console.log('Lista de operadores atualizada:', updated.length);
        return updated;
      });
      toast.success(`Operador "${operador.nome}" criado com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao salvar operador:', error);
      toast.error('Erro ao salvar operador');
      throw error;
    }
  };

  const saveInspetor = async (inspetor: { nome: string; certificacao: string; area: string }) => {
    try {
      console.log('Salvando inspetor:', inspetor);
      const { data, error } = await supabase
        .from('inspetores_qa')
        .insert([inspetor])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar inspetor:', error);
        throw error;
      }
      
      console.log('Inspetor salvo:', data);
      setInspetores(prev => {
        const updated = [data, ...prev];
        console.log('Lista de inspetores atualizada:', updated.length);
        return updated;
      });
      toast.success(`Inspetor QA "${inspetor.nome}" criado com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao salvar inspetor:', error);
      toast.error('Erro ao salvar inspetor');
      throw error;
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    obras,
    clientes,
    materiais,
    operadores,
    inspetores,
    loading,
    saveObra,
    saveCliente,
    saveMaterial,
    saveOperador,
    saveInspetor,
    refetch: fetchAll
  };
};
