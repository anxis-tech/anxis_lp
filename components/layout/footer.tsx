'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisLogo } from '@/components/ui/anxis-logo'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface FooterProps {
  companyName?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  socialLinks?: {
    instagram?: string
    facebook?: string
    linkedin?: string
  }
}

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export function Footer({
  companyName = 'ANXIS',
  email = 'contato@anxis.com.br',
  phone = '(11) 99999-9999',
  whatsapp = '5511999999999',
  address = 'São Paulo, SP - Brasil',
  socialLinks = {
    instagram: 'https://instagram.com/anxis.tech',
    facebook: 'https://facebook.com/anxis.tech',
  },
}: FooterProps) {
  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá ANXIS! Gostaria de conversar sobre um projeto digital.'
  )

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-[#070A12] text-[#F8FAFC] pt-20 pb-12 border-t border-slate-800/80 overflow-hidden select-none">
      {/* VIVID MULTI-CHROMA ACCENT TOP BORDER */}
      <div
        className="absolute top-0 inset-x-0 h-[2.5px] z-20"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,171,184,0) 0%, #00ABB8 20%, #086ec5 50%, #00C968 80%, rgba(0,201,104,0) 100%)',
          boxShadow: '0 1px 12px rgba(0, 171, 184, 0.4)',
        }}
      />

      {/* ATMOSPHERIC TECH BACKGROUND & GLOWS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#086ec5]/10 rounded-full blur-[170px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-[#00C968]/8 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* MAIN 4-COLUMN FOOTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-slate-800/80">
          {/* COL 1: BRAND IDENTITY, PITCH & SOCIAL MEDIA */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block cursor-pointer">
              <AnxisLogo size="md" theme="dark" />
            </Link>

            <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-sm">
              Desenvolvemos sites institucionais de alto impacto, landing pages de alta conversão e e-commerces
              escaláveis com código limpo, arquitetura veloz e design autoral.
            </p>

            {/* SOCIAL MEDIA ICONS */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={socialLinks?.instagram || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da ANXIS"
                onClick={() => trackEvent('click_social', { network: 'instagram' })}
                className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#E1306C]/60 hover:bg-[#E1306C]/10 transition-all duration-300 group shadow-sm cursor-pointer"
              >
                <InstagramIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-300 group-hover:text-[#F472B6]" />
              </a>

              <a
                href={socialLinks?.facebook || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook da ANXIS"
                onClick={() => trackEvent('click_social', { network: 'facebook' })}
                className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 transition-all duration-300 group shadow-sm cursor-pointer"
              >
                <FacebookIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-slate-300 group-hover:text-[#38BDF8]" />
              </a>
            </div>
          </div>

          {/* COL 2: QUICK NAVIGATION */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-[#00ABB8]">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300 font-medium">
              <li>
                <a href="#servicos" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Nossos Serviços
                </a>
              </li>
              <li>
                <a href="#projetos" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Portfólio de Projetos
                </a>
              </li>
              <li>
                <a href="#processo" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Metodologia & Processo
                </a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Depoimentos
                </a>
              </li>
              <li>
                <a href="#contato" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  Dúvidas Frequentes
                </a>
              </li>
            </ul>
          </div>

          {/* COL 3: SPECIALIZED SOLUTIONS */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-[#00ABB8]">
              Especialidades
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400 font-normal">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00C968]" />
                <span className="text-slate-300">Landing Pages de Alta Conversão</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00C968]" />
                <span className="text-slate-300">Sites Institucionais Responsivos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00C968]" />
                <span className="text-slate-300">Lojas Virtuais Tray & Nuvemshop</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00C968]" />
                <span className="text-slate-300">Desenvolvimento em Next.js & React</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00C968]" />
                <span className="text-slate-300">Design UI/UX & Prototipagem Figma</span>
              </li>
            </ul>
          </div>

          {/* COL 4: DIRECT CONTACT & INSTANT CTA */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-[#00ABB8]">
              Atendimento Direto
            </h4>

            <div className="space-y-3">
              {/* WhatsApp Fast Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('click_whatsapp', { location: 'footer_card' })}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-900 transition-all group cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <WhatsAppIcon className="w-4 h-4 fill-current text-[#25D366]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-heading">Falar no WhatsApp</div>
                    <div className="text-[11px] text-emerald-400 font-mono">Resposta em poucos minutos</div>
                  </div>
                </div>
                <Icon name="ArrowUpRight" size={14} className="text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* Email Direct Link */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300">
                <Icon name="Mail" size={15} className="text-[#00ABB8] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white truncate transition-colors font-medium">
                  {email}
                </a>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                <Icon name="MapPin" size={15} className="text-[#00C968] shrink-0" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA & COPYRIGHT ROW */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-normal">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-white font-bold">{companyName}</strong> Desenvolvimento
            Digital. Todos os direitos reservados.
          </p>

          {/* Back to top button */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo da página"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Voltar ao topo</span>
            <Icon name="ArrowUp" size={13} className="text-[#00ABB8]" />
          </button>
        </div>
      </div>
    </footer>
  )
}
