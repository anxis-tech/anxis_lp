'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisLogo } from '@/components/ui/anxis-logo'
import { formatWhatsAppLink } from '@/lib/utils'

interface FooterProps {
  companyName?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  socialLinks?: {
    instagram?: string
    linkedin?: string
  }
}

export function Footer({
  companyName = 'ANXIS',
  email = 'contato@anxis.com.br',
  phone = '(11) 99999-9999',
  whatsapp = '5511999999999',
  address = 'São Paulo, SP - Brasil',
}: FooterProps) {
  const whatsappUrl = formatWhatsAppLink(whatsapp, 'Olá ANXIS!')

  return (
    <footer className="bg-[#F8FAFC] text-[#0F172A] pt-20 pb-12 border-t border-slate-200/90 relative overflow-hidden">
      {/* Top subtle brand gradient line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] opacity-80" />
      
      {/* Subtle Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0099FF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-slate-200">
          {/* COL 1: LOGO & ABOUT */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block cursor-pointer">
              <AnxisLogo size="md" theme="light" />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Empresa especializada em desenvolvimento de sites institucionais, e-commerces (Tray, Nuvemshop, WooCommerce) e projetos personalizados em código com foco em conversão e desempenho.
            </p>
          </div>

          {/* COL 2: NAVIGATION */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#0F172A]">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
              <li><a href="#sobre" className="hover:text-orange-600 transition-colors">Sobre a ANXIS</a></li>
              <li><a href="#servicos" className="hover:text-orange-600 transition-colors">Serviços</a></li>
              <li><a href="#projetos" className="hover:text-orange-600 transition-colors">Portfólio</a></li>
              <li><a href="#processo" className="hover:text-orange-600 transition-colors">Processo</a></li>
              <li><a href="#contato" className="hover:text-orange-600 transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* COL 3: SOLUTIONS */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#0F172A]">Soluções</h4>
            <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
              <li><span>Sites Institucionais Responsivos</span></li>
              <li><span>Landing Pages de Alta Conversão</span></li>
              <li><span>Lojas Virtuais Tray & Nuvemshop</span></li>
              <li><span>Reformulação de Sites Legados</span></li>
              <li><span>Desenvolvimento Customizado em Next.js</span></li>
            </ul>
          </div>

          {/* COL 4: CONTACT & QUICK CTA */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#0F172A]">Contato Direto</h4>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li className="flex items-center gap-2.5">
                <Icon name="Mail" size={18} className="text-[#0099FF] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-[#0F172A] transition-colors">{email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="Phone" size={18} className="text-emerald-600 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0F172A] transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="MapPin" size={18} className="text-amber-500 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & ADMIN LINK */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {companyName} Desenvolvimento Digital. Todos os direitos reservados.</p>

          <div className="flex items-center gap-6">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0F172A] transition-colors opacity-80 hover:opacity-100" title="Área Restrita do Cliente">
              <Icon name="Lock" size={14} />
              <span>Painel Administrativo</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
