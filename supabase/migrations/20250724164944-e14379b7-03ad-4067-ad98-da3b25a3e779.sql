-- PHASE 1B: Create RLS policies for usuarios table

-- Usuarios table policies - users can only see their own data, admins can see all
CREATE POLICY "Users can view their own profile" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
ON public.usuarios 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create users" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any user" 
ON public.usuarios 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete users" 
ON public.usuarios 
FOR DELETE 
USING (public.is_admin(auth.uid()) AND id != auth.uid());