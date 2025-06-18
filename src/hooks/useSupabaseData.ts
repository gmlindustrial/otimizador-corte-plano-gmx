
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
      
      const [obrasRes, clientesRes, materiaisRes, operadoresRes, inspetoresRes] = await Promise.all([
        supabase.from('obras').select('*').order('created_at', { ascending: false }),
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        supabase.from('materiais').select('*').order('created_at', { ascending: false }),
        supabase.from('operadores').select('*').order('created_at', { ascending: false }),
        supabase.from('inspetores_qa').select('*').order('created_at', { ascending: false })
      ]);

      if (obrasRes.error) throw obrasRes.error;
      if (clientesRes.error) throw clientesRes.error;
      if (materiaisRes.error) throw materiaisRes.error;
      if (operadoresRes.error) throw operadoresRes.error;
      if (inspetoresRes.error) throw inspetoresRes.error;

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
      const { data, error } = await supabase
        .from('obras')
        .insert([obra])
        .select()
        .single();

      if (error) throw error;
      
      setObras(prev => [data, ...prev]);
      toast.success(`Obra "${obra.nome}" criada com sucesso!`);
      return data;
    } catch (error) {
      console.error('Erro ao salvar obra:', error);
      toast.error('Erro ao salvar obra');
      throw error;
    }
  };

  const saveCliente = async (cliente: { nome: string; contato: string; email: string; telefone: string }) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) throw error;
      
      setClientes(prev => [data, ...prev]);
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
      const { data, error } = await supabase
        .from('materiais')
        .insert([{
          tipo: material.tipo,
          descricao: material.descricao,
          comprimento_padrao: material.comprimentoPadrao
        }])
        .select()
        .single();

      if (error) throw error;
      
      setMateriais(prev => [data, ...prev]);
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
      const { data, error } = await supabase
        .from('operadores')
        .insert([operador])
        .select()
        .single();

      if (error) throw error;
      
      setOperadores(prev => [data, ...prev]);
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
      const { data, error } = await supabase
        .from('inspetores_qa')
        .insert([inspetor])
        .select()
        .single();

      if (error) throw error;
      
      setInspetores(prev => [data, ...prev]);
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
