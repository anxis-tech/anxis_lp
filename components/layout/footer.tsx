import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone, MapPin, Lock } from 'lucide-react'
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
  socialLinks = {
    instagram: 'https://instagram.com/anxis.digital',
    linkedin: 'https://linkedin.com/company/anxis-digital',
  },
}: FooterProps) {
  const whatsappUrl = formatWhatsAppLink(whatsapp, 'Olá ANXIS!')

  return (
    <footer className="bg-[#081D3A] text-white pt-16 pb-12 border-t border-[#0075FF]/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          {/* COL 1: LOGO & ABOUT (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative w-40 h-10">
              <Image
                src="/images/logo-transparente.png"
                alt="ANXIS - Desenvolvimento de Sites e Lojas Virtuais"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xs text-[#BBC4D1] leading-relaxed max-w-sm">
              Empresa especializada em desenvolvimento de sites institucionais, e-commerces (Tray, Nuvemshop, WooCommerce) e projetos personalizados em código com foco em conversão e desempenho.
            </p>
          </div>

          {/* COL 2: QUICK NAVIGATION (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegação</h4>
            <ul className="space-y-2 text-xs text-[#BBC4D1]">
              <li><a href="#servicos" className="hover:text-[#0075FF] transition-colors">Serviços</a></li>
              <li><a href="#projetos" className="hover:text-[#0075FF] transition-colors">Portfólio</a></li>
              <li><a href="#tecnologias" className="hover:text-[#0075FF] transition-colors">Tecnologias</a></li>
              <li><a href="#diferenciais" className="hover:text-[#0075FF] transition-colors">Diferenciais</a></li>
              <li><a href="#processo" className="hover:text-[#0075FF] transition-colors">Processo</a></li>
              <li><a href="#faq" className="hover:text-[#0075FF] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* COL 3: SERVICES (3 COLS) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Soluções</h4>
            <ul className="space-y-2 text-xs text-[#BBC4D1]">
              <li><span>Sites Institucionais Responsivos</span></li>
              <li><span>Landing Pages de Alta Conversão</span></li>
              <li><span>Lojas Virtuais Tray, Nuvemshop & WooCommerce</span></li>
              <li><span>Reformulação & Modernização de Sites</span></li>
              <li><span>Desenvolvimento Customizado em Next.js</span></li>
              <li><span>Integrações de APIs & Automações</span></li>
            </ul>
          </div>

          {/* COL 4: CONTACT & SOCIAL (3 COLS) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contato</h4>
            <ul className="space-y-2.5 text-xs text-[#BBC4D1]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0075FF] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0075FF] shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & ADMIN LINK */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#657184]">
          <p>© {new Date().getFullYear()} {companyName} Desenvolvimento Digital. Todos os direitos reservados.</p>

          <div className="flex items-center gap-6">
            <Link href="/admin" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors opacity-60 hover:opacity-100" title="Área Restrita do Cliente">
              <Lock className="w-3 h-3" />
              <span>Painel</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
