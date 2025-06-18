
-- Criar tabela de obras
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de materiais
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT,
  comprimento_padrao INTEGER NOT NULL DEFAULT 6000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de operadores
CREATE TABLE public.operadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  turno TEXT NOT NULL,
  especialidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de inspetores QA
CREATE TABLE public.inspetores_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  certificacao TEXT,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de projetos
CREATE TABLE public.projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  numero_projeto TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  obra_id UUID REFERENCES public.obras(id),
  material_id UUID REFERENCES public.materiais(id),
  operador_id UUID REFERENCES public.operadores(id),
  inspetor_id UUID REFERENCES public.inspetores_qa(id),
  lista TEXT NOT NULL DEFAULT 'LISTA 01',
  revisao TEXT NOT NULL DEFAULT 'REV-00',
  turno TEXT NOT NULL,
  validacao_qa BOOLEAN NOT NULL DEFAULT false,
  enviar_sobras_estoque BOOLEAN NOT NULL DEFAULT true,
  qr_code TEXT,
  dados_projeto JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de otimizações
CREATE TABLE public.historico_otimizacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id),
  pecas JSONB NOT NULL,
  resultados JSONB NOT NULL,
  bar_length INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de estoque de sobras
CREATE TABLE public.estoque_sobras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materiais(id),
  comprimento INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  localizacao TEXT NOT NULL,
  projeto_origem UUID REFERENCES public.projetos(id),
  disponivel BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspetores_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_otimizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_sobras ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas (para desenvolvimento - ajustar conforme necessário)
-- Obras
CREATE POLICY "Permitir tudo em obras" ON public.obras FOR ALL USING (true) WITH CHECK (true);

-- Clientes
CREATE POLICY "Permitir tudo em clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Materiais
CREATE POLICY "Permitir tudo em materiais" ON public.materiais FOR ALL USING (true) WITH CHECK (true);

-- Operadores
CREATE POLICY "Permitir tudo em operadores" ON public.operadores FOR ALL USING (true) WITH CHECK (true);

-- Inspetores QA
CREATE POLICY "Permitir tudo em inspetores_qa" ON public.inspetores_qa FOR ALL USING (true) WITH CHECK (true);

-- Projetos
CREATE POLICY "Permitir tudo em projetos" ON public.projetos FOR ALL USING (true) WITH CHECK (true);

-- Histórico de otimizações
CREATE POLICY "Permitir tudo em historico_otimizacoes" ON public.historico_otimizacoes FOR ALL USING (true) WITH CHECK (true);

-- Estoque de sobras
CREATE POLICY "Permitir tudo em estoque_sobras" ON public.estoque_sobras FOR ALL USING (true) WITH CHECK (true);

-- Inserir dados iniciais para teste
INSERT INTO public.obras (nome, endereco, responsavel) VALUES
('Obra Industrial A', 'Rua Industrial, 123', 'João Supervisor'),
('Complexo Residencial B', 'Av. Central, 456', 'Maria Gerente'),
('Fábrica XYZ', 'Distrito Industrial', 'Pedro Coordenador'),
('Shopping Center ABC', 'Centro da Cidade', 'Ana Diretora');

INSERT INTO public.clientes (nome, contato, email, telefone) VALUES
('Construtora Alpha', 'Carlos Silva', 'carlos@alpha.com', '(11) 99999-0001'),
('Engenharia Beta', 'Lucia Santos', 'lucia@beta.com', '(11) 99999-0002'),
('Indústria Gamma', 'Roberto Costa', 'roberto@gamma.com', '(11) 99999-0003'),
('Metalúrgica Delta', 'Sandra Oliveira', 'sandra@delta.com', '(11) 99999-0004');

INSERT INTO public.materiais (tipo, descricao, comprimento_padrao) VALUES
('Perfil W 150x13', 'Perfil estrutural soldado W150x13mm', 6000),
('Perfil UE 100x50x17x3', 'Perfil U enrijecido 100x50x17x3mm', 6000),
('Perfil U 200x75x20x3', 'Perfil U 200x75x20x3mm', 6000),
('Perfil L 50x50x5', 'Perfil L 50x50x5mm', 6000),
('Perfil T 100x50x8', 'Perfil T 100x50x8mm', 6000),
('Barra Redonda Ø 20mm', 'Barra redonda diâmetro 20mm', 6000),
('Barra Quadrada 25x25mm', 'Barra quadrada 25x25mm', 6000);

INSERT INTO public.operadores (nome, turno, especialidade) VALUES
('João Silva', '1', 'Corte de perfis estruturais'),
('Maria Santos', '2', 'Operação de máquinas CNC'),
('Pedro Costa', '3', 'Corte de barras e tubos'),
('Ana Oliveira', 'Central', 'Supervisão geral');

INSERT INTO public.inspetores_qa (nome, certificacao, area) VALUES
('Carlos Inspetor', 'ISO 9001, NBR 14931', 'Estruturas Metálicas'),
('Lucia Qualidade', 'ISO 9001, ASME', 'Soldagem e Corte'),
('Roberto QA', 'NBR 14931, AWS D1.1', 'Controle Dimensional'),
('Sandra Controle', 'ISO 9001, NBR 8800', 'Qualidade Geral');
