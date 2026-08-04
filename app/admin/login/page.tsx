'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, Loader2, ArrowRight, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message || 'Credenciais inválidas. Verifique e-mail e senha.')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de conexão com o banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#081D3A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0B2F63] border border-[#BBC4D1]/20 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0075FF]/20 rounded-full blur-2xl pointer-events-none" />

        {/* LOGO & TITLE */}
        <div className="text-center space-y-3">
          <div className="relative w-44 h-10 mx-auto">
            <Image
              src="/images/logo-dark.svg"
              alt="ANXIS Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0075FF]/20 text-[#168CFF] text-[11px] font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>PAINEL ADMINISTRATIVO RESTRITO</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              E-mail de Administrador
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@anxis.com.br"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#081D3A] border border-slate-700 text-white placeholder-slate-500 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#081D3A] border border-slate-700 text-white placeholder-slate-500 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span>Acesso protegido por Supabase Auth & RLS.</span>
        </div>
      </div>
    </div>
  )
}
