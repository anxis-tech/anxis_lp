'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/hugeicons'
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
    <footer className="bg-[#293233] text-white pt-20 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Subtle Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ABB8]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-white/10">
          {/* COL 1: LOGO & ABOUT */}
          <div className="lg:col-span-4 space-y-5">
            <div className="relative w-44 h-11 bg-white/10 p-1.5 rounded-xl border border-white/10">
              <Image
                src="/images/logo-transparente.png"
                alt="ANXIS - Desenvolvimento de Sites e Lojas Virtuais"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Empresa especializada em desenvolvimento de sites institucionais, e-commerces (Tray, Nuvemshop, WooCommerce) e projetos personalizados em código com foco em conversão e desempenho.
            </p>
          </div>

          {/* COL 2: NAVIGATION */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00C4D4]">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-slate-300 font-medium">
              <li><a href="#sobre" className="hover:text-[#00C4D4] transition-colors">Sobre a ANXIS</a></li>
              <li><a href="#servicos" className="hover:text-[#00C4D4] transition-colors">Serviços</a></li>
              <li><a href="#projetos" className="hover:text-[#00C4D4] transition-colors">Portfólio</a></li>
              <li><a href="#tecnologias" className="hover:text-[#00C4D4] transition-colors">Tecnologias</a></li>
              <li><a href="#contato" className="hover:text-[#00C4D4] transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* COL 3: SOLUTIONS */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00C4D4]">Soluções</h4>
            <ul className="space-y-2.5 text-sm text-slate-300 font-medium">
              <li><span>Sites Institucionais Responsivos</span></li>
              <li><span>Landing Pages de Alta Conversão</span></li>
              <li><span>Lojas Virtuais Tray, Nuvemshop & WooCommerce</span></li>
              <li><span>Reformulação & Modernização de Sites</span></li>
              <li><span>Desenvolvimento Customizado em Next.js</span></li>
            </ul>
          </div>

          {/* COL 4: CONTACT & QUICK CTA */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#00C4D4]">Contato Directo</h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li className="flex items-center gap-2.5">
                <Icon name="Mail" size={18} className="text-[#00C4D4] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="Phone" size={18} className="text-emerald-400 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="MapPin" size={18} className="text-[#00C4D4] shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & ADMIN LINK */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {companyName} Desenvolvimento Digital. Todos os direitos reservados.</p>

          <div className="flex items-center gap-6">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors opacity-80 hover:opacity-100" title="Área Restrita do Cliente">
              <Icon name="Lock" size={14} />
              <span>Painel Administrativo</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
