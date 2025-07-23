-- Criar tabela principal de auditoria
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES public.usuarios(id),
  user_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para ações de sistema específicas
CREATE TABLE public.system_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES public.usuarios(id),
  user_name TEXT,
  description TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas tabelas de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_activity_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para audit_logs (apenas administradores podem ver todos os logs)
CREATE POLICY "Administradores podem ver todos os audit_logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sistema pode inserir audit_logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Criar políticas RLS para system_activity_logs
CREATE POLICY "Administradores podem ver todos os system_activity_logs" 
ON public.system_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sistema pode inserir system_activity_logs" 
ON public.system_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Função para capturar informações do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_id UUID, user_name TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.nome
  FROM public.usuarios u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

-- Função de trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_info RECORD;
BEGIN
  -- Obter informações do usuário atual
  SELECT * INTO user_info FROM public.get_current_user_info();
  
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action_type,
    user_id,
    user_name,
    old_values,
    new_values,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    user_info.user_id,
    user_info.user_name,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers nas tabelas principais
CREATE TRIGGER audit_projetos 
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_projeto_pecas 
  AFTER INSERT OR UPDATE OR DELETE ON public.projeto_pecas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_projeto_otimizacoes 
  AFTER INSERT OR UPDATE OR DELETE ON public.projeto_otimizacoes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Índices para melhor performance
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);

CREATE INDEX idx_system_activity_logs_timestamp ON public.system_activity_logs(timestamp DESC);
CREATE INDEX idx_system_activity_logs_user_id ON public.system_activity_logs(user_id);
CREATE INDEX idx_system_activity_logs_entity_type ON public.system_activity_logs(entity_type);