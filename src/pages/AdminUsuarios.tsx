import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { usuarioService } from '@/services';
import type { Usuario } from '@/services';

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [novo, setNovo] = useState({ nome: '', email: '', password: '', role: 'usuario' });
  const [editando, setEditando] = useState<Usuario | null>(null);

  const carregar = async () => {
    const { data } = await usuarioService.getAll();
    if (data) setUsuarios(data);
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvarNovo = async () => {
    // Cria usuário no sistema de autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: novo.email,
      password: novo.password,
    });

    if (authError || !authData?.user) {
      console.error('Erro ao criar usuário', authError);
      return;
    }

    await usuarioService.create({
      data: {
        id: authData.user.id,
        nome: novo.nome,
        email: novo.email,
        role: novo.role,
      },
    });

    setNovo({ nome: '', email: '', password: '', role: 'usuario' });
    carregar();
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    await usuarioService.update({ id: editando.id, data: editando });
    setEditando(null);
    carregar();
  };

  const remover = async (id: string) => {
    await usuarioService.delete({ id });
    carregar();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto space-y-6">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <CardTitle>Cadastro de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Input
                placeholder="Nome"
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              />
              <Input
                placeholder="Senha"
                type="password"
                value={novo.password}
                onChange={(e) => setNovo({ ...novo, password: e.target.value })}
              />
              <Select
                value={novo.role}
                onValueChange={(value) => setNovo({ ...novo, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">administrador</SelectItem>
                  <SelectItem value="usuario">usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={salvarNovo} disabled={!novo.nome || !novo.email || !novo.password}>
              Criar Usuário
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-t-lg">
            <CardTitle>Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.nome}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2 space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditando(u)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remover(u.id)}>
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {editando && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white rounded-t-lg">
              <CardTitle>Editar Usuário</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Nome"
                  value={editando.nome}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  value={editando.email}
                  onChange={(e) => setEditando({ ...editando, email: e.target.value })}
                />
                <Select
                  value={editando.role}
                  onValueChange={(value) =>
                    setEditando((prev) => (prev ? { ...prev, role: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">administrador</SelectItem>
                    <SelectItem value="usuario">usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-x-2">
                <Button onClick={salvarEdicao}>Salvar</Button>
                <Button variant="secondary" onClick={() => setEditando(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
