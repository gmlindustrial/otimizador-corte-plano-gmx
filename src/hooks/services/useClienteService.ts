
import { useState } from 'react';
import { clienteService } from '@/services';
import type { Cliente } from '@/services/interfaces';

export const useClienteService = () => {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const fetchClientes = async () => {
    setLoading(true);
    const response = await clienteService.getAll();
    if (response.success) {
      setClientes(response.data);
    }
    setLoading(false);
    return response;
  };

  const createCliente = async (clienteData: Omit<Cliente, 'id' | 'created_at'>) => {
    setLoading(true);
    const response = await clienteService.create({ data: clienteData });
    if (response.success && response.data) {
      setClientes(prev => [response.data!, ...prev]);
    }
    setLoading(false);
    return response;
  };

  const updateCliente = async (id: string, clienteData: Partial<Omit<Cliente, 'id' | 'created_at'>>) => {
    setLoading(true);
    const response = await clienteService.update({ id, data: clienteData });
    if (response.success && response.data) {
      setClientes(prev => prev.map(cliente => cliente.id === id ? response.data! : cliente));
    }
    setLoading(false);
    return response;
  };

  const deleteCliente = async (id: string) => {
    setLoading(true);
    const response = await clienteService.delete({ id });
    if (response.success) {
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
    }
    setLoading(false);
    return response;
  };

  return {
    clientes,
    loading,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente
  };
};
