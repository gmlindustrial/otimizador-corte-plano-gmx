
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from './ErrorHandler';
import type { 
  ServiceResponse, 
  ListResponse, 
  CreateRequest, 
  UpdateRequest, 
  DeleteRequest, 
  QueryOptions,
  BaseEntity 
} from './types';

export abstract class BaseService<T extends BaseEntity> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(options?: QueryOptions): Promise<ListResponse<T>> {
    try {
      let query = supabase.from(this.tableName).select('*');
      
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: (data as T[]) || [],
        error: null,
        success: true,
        total: data?.length || 0
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, `Erro ao buscar ${this.tableName}`);
      return {
        data: [],
        error: errorMessage,
        success: false,
        total: 0
      };
    }
  }

  async getById(id: string): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, `Erro ao buscar ${this.tableName} por ID`);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async create(request: CreateRequest<T>): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([request.data as any])
        .select()
        .single();

      if (error) throw error;

      ErrorHandler.handleSuccess(`${this.tableName} criado com sucesso!`);
      
      return {
        data: data as T,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, `Erro ao criar ${this.tableName}`);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async update(request: UpdateRequest<T>): Promise<ServiceResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(request.data as any)
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;

      ErrorHandler.handleSuccess(`${this.tableName} atualizado com sucesso!`);
      
      return {
        data: data as T,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, `Erro ao atualizar ${this.tableName}`);
      return {
        data: null,
        error: errorMessage,
        success: false
      };
    }
  }

  async delete(request: DeleteRequest): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', request.id);

      if (error) throw error;

      ErrorHandler.handleInfo(`${this.tableName} removido com sucesso!`);
      
      return {
        data: true,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error, `Erro ao remover ${this.tableName}`);
      return {
        data: false,
        error: errorMessage,
        success: false
      };
    }
  }
}
