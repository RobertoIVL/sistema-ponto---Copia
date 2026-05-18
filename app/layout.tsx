import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistema de Ponto',
  description: 'Sistema de controle de ponto eletrônico',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="bg-[var(--background)]">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
