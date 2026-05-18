'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [nome, setNome] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // Cadastro
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
              `${window.location.origin}/auth/callback`,
            data: {
              nome: nome,
            }
          }
        })

        if (signUpError) throw signUpError

        if (authData.user) {
          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from('usuarios')
            .insert({
              user_id: authData.user.id,
              nome: nome,
              email: email,
              is_admin: false,
              ativo: true
            })

          if (profileError && !profileError.message.includes('duplicate')) {
            console.error('Erro ao criar perfil:', profileError)
          }
        }

        setError('Verifique seu email para confirmar o cadastro!')
      } else {
        // Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl p-8 shadow-lg" style={{ backgroundColor: 'var(--card)' }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--card-foreground)' }}>
              Sistema de Ponto
            </h1>
            <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {isSignUp ? 'Crie sua conta' : 'Faça login para continuar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-foreground)' }}>
                  Nome completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-foreground)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-foreground)' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ 
                backgroundColor: error.includes('Verifique') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: error.includes('Verifique') ? 'var(--success)' : 'var(--destructive)'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {isLoading ? 'Carregando...' : (isSignUp ? 'Criar conta' : 'Entrar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-sm hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
