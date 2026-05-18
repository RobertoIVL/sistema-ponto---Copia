import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Buscar perfil do usuário
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Se não tem perfil, criar um
  if (!usuario) {
    const { data: newUsuario } = await supabase
      .from('usuarios')
      .insert({
        user_id: user.id,
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        email: user.email!,
        is_admin: false,
        ativo: true
      })
      .select()
      .single()
    
    return <DashboardClient usuario={newUsuario} userEmail={user.email!} />
  }

  // Buscar registros de hoje
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const { data: registrosHoje } = await supabase
    .from('registros_ponto')
    .select('*')
    .eq('usuario_id', usuario.id)
    .gte('data_hora', hoje.toISOString())
    .order('data_hora', { ascending: true })

  return (
    <DashboardClient 
      usuario={usuario} 
      userEmail={user.email!}
      registrosHoje={registrosHoje || []}
    />
  )
}
