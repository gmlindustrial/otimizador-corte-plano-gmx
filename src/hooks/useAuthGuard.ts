import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export const useAuthGuard = (requiredRole?: string) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setUser(userData)

      if (requiredRole) {
        if (userData?.role !== requiredRole) {
          navigate('/')
        }
      }
    }

    void checkAccess()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void checkAccess()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, requiredRole])

  return { user }
}
