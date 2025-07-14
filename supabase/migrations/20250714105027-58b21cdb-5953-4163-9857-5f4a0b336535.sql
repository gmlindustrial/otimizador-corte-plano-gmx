-- Adicionar constraint de foreign key entre estoque_sobras e perfis_materiais
ALTER TABLE public.estoque_sobras 
ADD CONSTRAINT estoque_sobras_perfil_fkey 
FOREIGN KEY (id_perfis_materiais) 
REFERENCES public.perfis_materiais(id) 
ON DELETE SET NULL;