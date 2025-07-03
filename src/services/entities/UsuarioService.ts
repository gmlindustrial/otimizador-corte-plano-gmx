
import { BaseService } from '../base/BaseService';
import { supabase } from '@/integrations/supabase/client';
import type { Usuario } from '../interfaces';
import type { CreateRequest, ServiceResponse } from '../base/types';

export class UsuarioService extends BaseService<Usuario> {
  constructor() {
    super('usuarios');
  }

  // Override create method to handle auth user ID
  async create(request: CreateRequest<Usuario> & { id?: string }): Promise<ServiceResponse<Usuario>> {
    const insertData = request.id ? { ...request.data, id: request.id } : request.data;
    
    const { data: result, error } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false
      };
    }

    return {
      data: result as Usuario,
      error: null,
      success: true
    };
  }
}

export const usuarioService = new UsuarioService();
