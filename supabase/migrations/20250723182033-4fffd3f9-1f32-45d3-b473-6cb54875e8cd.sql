-- Alterar o tipo do campo entity_id de uuid para text para aceitar identificadores flexíveis
ALTER TABLE public.system_activity_logs 
ALTER COLUMN entity_id TYPE text USING entity_id::text;