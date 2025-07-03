
-- Criar tabela de preços de materiais
CREATE TABLE public.material_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materiais(id) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 5.50,
  price_per_m2 DECIMAL(10,2) NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('tempo_medio_por_peca', '2.5', 'Tempo médio em minutos para cortar uma peça'),
('meta_eficiencia', '85', 'Meta de eficiência em porcentagem'),
('densidade_aco', '7.85', 'Densidade do aço em kg/m³'),
('capacidade_turno_horas', '8', 'Capacidade de horas por turno');

-- Inserir preços padrão para materiais existentes
INSERT INTO public.material_prices (material_id, price_per_kg)
SELECT id, 5.50 FROM public.materiais;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para as novas tabelas
CREATE POLICY "Permitir tudo em material_prices" 
  ON public.material_prices 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir tudo em system_settings" 
  ON public.system_settings 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
