'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'
import { LockActionIcon, MailActionIcon } from '@/lib/icons/actions'
import { ForwardNavIcon } from '@/lib/icons/navigation'
import { ShieldStatusIcon, SuccessStatusIcon, SpinnerStatusIcon } from '@/lib/icons/status'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
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
        setLoading(false)
      } else {
        // Show loading screen animation before entering admin panel
        setIsTransitioning(true)
        setTimeout(() => {
          router.push('/admin')
          router.refresh()
        }, 700)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de conexão com o banco de dados.')
      setLoading(false)
    }
  }

  // LOADING TRANSITION OVERLAY SCREEN BEFORE ENTERING ADMIN PANEL
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 z-50 bg-[#081D3A] text-white flex flex-col items-center justify-center p-6 space-y-6 font-sans overflow-hidden animate-in fade-in duration-300">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0075FF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-52 h-14 animate-pulse">
          <Image
            src="/images/logo-transparente.png"
            alt="ANXIS Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-3 bg-[#0B2F63]/80 border border-[#BBC4D1]/20 p-6 rounded-3xl shadow-2xl backdrop-blur-md max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#0075FF]/20 border border-[#0075FF]/40 flex items-center justify-center text-[#168CFF]">
            <Icon icon={SpinnerStatusIcon} size={24} className="animate-spin text-[#0075FF]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center justify-center gap-1.5">
              <Icon icon={SuccessStatusIcon} size={18} className="text-emerald-400" />
              <span>Login efetuado com sucesso!</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">Carregando permissões e dados do painel...</p>
          </div>

          <div className="w-full bg-[#081D3A] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-[#0075FF] h-full animate-pulse w-full transition-all duration-700 ease-out" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#081D3A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0B2F63] border border-[#BBC4D1]/20 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0075FF]/20 rounded-full blur-2xl pointer-events-none" />

        {/* LOGO & TITLE */}
        <div className="text-center space-y-3">
          <div className="relative w-48 h-12 mx-auto">
            <Image
              src="/images/logo-transparente.png"
              alt="ANXIS Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0075FF]/20 text-[#168CFF] text-[11px] font-bold">
            <Icon icon={ShieldStatusIcon} size={14} />
            <span>PAINEL ADMINISTRATIVO RESTRITO</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              E-mail de Acesso
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
                <Icon icon={MailActionIcon} size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#081D3A] border border-slate-700 text-white placeholder-slate-500 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
                <Icon icon={LockActionIcon} size={18} />
              </span>
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
              <div className="flex items-center gap-2">
                <Icon icon={SpinnerStatusIcon} size={18} className="animate-spin" />
                <span>Autenticando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Acessar Painel</span>
                <Icon icon={ForwardNavIcon} size={18} />
              </div>
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
