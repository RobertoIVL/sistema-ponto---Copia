'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type TipoPonto = 'entrada' | 'saida' | 'almoco_inicio' | 'almoco_fim'

interface RegistroPonto {
  id: string
  tipo: TipoPonto
  data_hora: string
  observacao?: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  cargo?: string
  departamento?: string
  is_admin: boolean
}

interface Props {
  usuario: Usuario | null
  userEmail: string
  registrosHoje?: RegistroPonto[]
}

const tipoLabels: Record<TipoPonto, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  almoco_inicio: 'Início Almoço',
  almoco_fim: 'Fim Almoço'
}

const tipoIcons: Record<TipoPonto, string> = {
  entrada: '🟢',
  saida: '🔴',
  almoco_inicio: '🍽️',
  almoco_fim: '☕'
}

export default function DashboardClient({ usuario, userEmail, registrosHoje = [] }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [registros, setRegistros] = useState<RegistroPonto[]>(registrosHoje)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const registrarPonto = async (tipo: TipoPonto) => {
    if (!usuario) return
    
    setIsLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase
        .from('registros_ponto')
        .insert({
          usuario_id: usuario.id,
          tipo,
          data_hora: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setRegistros([...registros, data])
      setMessage({ type: 'success', text: `${tipoLabels[tipo]} registrada com sucesso!` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro ao registrar ponto' })
    } finally {
      setIsLoading(false)
    }
  }

  const getProximoTipo = (): TipoPonto | null => {
    if (registros.length === 0) return 'entrada'
    
    const tipos = registros.map(r => r.tipo)
    if (!tipos.includes('entrada')) return 'entrada'
    if (!tipos.includes('almoco_inicio')) return 'almoco_inicio'
    if (!tipos.includes('almoco_fim')) return 'almoco_fim'
    if (!tipos.includes('saida')) return 'saida'
    
    return null
  }

  const proximoTipo = getProximoTipo()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold" style={{ color: 'var(--card-foreground)' }}>Sistema de Ponto</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{usuario?.nome || userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Clock Card */}
        <div className="rounded-xl p-8 mb-8 text-center" style={{ backgroundColor: 'var(--card)' }}>
          <p className="text-sm mb-2 capitalize" style={{ color: 'var(--muted-foreground)' }}>
            {formatDate(currentTime)}
          </p>
          <div className="text-6xl font-mono font-bold mb-6" style={{ color: 'var(--card-foreground)' }}>
            {formatTime(currentTime)}
          </div>
          
          {message && (
            <div 
              className="mb-6 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? 'var(--success)' : 'var(--destructive)'
              }}
            >
              {message.text}
            </div>
          )}

          {proximoTipo ? (
            <button
              onClick={() => registrarPonto(proximoTipo)}
              disabled={isLoading}
              className="px-8 py-4 rounded-xl text-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isLoading ? 'Registrando...' : `Registrar ${tipoLabels[proximoTipo]}`}
            </button>
          ) : (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
              Todos os registros do dia foram realizados!
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(['entrada', 'almoco_inicio', 'almoco_fim', 'saida'] as TipoPonto[]).map((tipo) => {
            const jaRegistrado = registros.some(r => r.tipo === tipo)
            return (
              <button
                key={tipo}
                onClick={() => !jaRegistrado && registrarPonto(tipo)}
                disabled={isLoading || jaRegistrado}
                className="p-4 rounded-xl text-center transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: jaRegistrado ? 'var(--muted)' : 'var(--card)',
                  borderWidth: '1px',
                  borderColor: 'var(--border)'
                }}
              >
                <span className="text-2xl block mb-2">{tipoIcons[tipo]}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>
                  {tipoLabels[tipo]}
                </span>
                {jaRegistrado && (
                  <span className="block text-xs mt-1" style={{ color: 'var(--success)' }}>
                    Registrado
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Today's Records */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--card-foreground)' }}>
            Registros de Hoje
          </h2>
          
          {registros.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              Nenhum registro encontrado hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {registros.map((registro) => (
                <div 
                  key={registro.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--secondary)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tipoIcons[registro.tipo]}</span>
                    <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
                      {tipoLabels[registro.tipo]}
                    </span>
                  </div>
                  <span className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(registro.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
