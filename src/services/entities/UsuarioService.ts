
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Usuario } from '../interfaces';

export class UsuarioService extends BaseService<Usuario> {
  constructor() {
    super('usuarios');
  }

  // Override create method to handle auth user ID
  async create({ data, id }: { data: Omit<Usuario, 'id' | 'created_at'>; id?: string }) {
    const insertData = id ? { ...data, id } : data;
    
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    return {
      data: result,
      error: error?.message || null,
      success: !error
    };
  }
}

export const usuarioService = new UsuarioService();
