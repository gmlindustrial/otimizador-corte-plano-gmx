import { BaseService } from '../base/BaseService';
import type { Usuario } from '../interfaces';

export class UsuarioService extends BaseService<Usuario> {
  constructor() {
    super('usuarios');
  }
}

export const usuarioService = new UsuarioService();
