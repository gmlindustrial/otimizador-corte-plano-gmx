-- Corrigir a política RLS para aceitar tanto 'admin' quanto 'administrador'
DROP POLICY IF EXISTS "Administradores podem ver todos os audit_logs" ON public.audit_logs;

CREATE POLICY "Administradores podem ver todos os audit_logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role IN ('admin', 'administrador')
  )
);

-- Também corrigir a política para system_activity_logs para consistência
DROP POLICY IF EXISTS "Administradores podem ver todos os system_activity_logs" ON public.system_activity_logs;

CREATE POLICY "Administradores podem ver todos os system_activity_logs" 
ON public.system_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role IN ('admin', 'administrador')
  )
);