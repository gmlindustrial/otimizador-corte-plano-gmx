
// Types base para todos os services
export interface BaseEntity {
  id: string;
  created_at: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ListResponse<T> {
  data: T[];
  error: string | null;
  success: boolean;
  total: number;
}

export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'created_at'>;
}

export interface UpdateRequest<T> {
  id: string;
  data: Partial<Omit<T, 'id' | 'created_at'>>;
}

export interface DeleteRequest {
  id: string;
}

export interface QueryOptions {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}
