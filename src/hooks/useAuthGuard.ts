import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export const useAuthGuard = (requiredRole?: string) => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      if (requiredRole) {
        const { data } = await supabase
          .from('usuarios')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (data?.role !== requiredRole) {
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
}
