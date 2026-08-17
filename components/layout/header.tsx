'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisLogo } from '@/components/ui/anxis-logo'
import { cn, formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface HeaderProps {
  phone?: string
  whatsapp?: string
  ctaLabel?: string
}

export function Header({ whatsapp = '5511999999999', ctaLabel = 'Falar Conosco' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const navLinks = [
    { label: 'Home', href: '#', hasDropdown: false },
    { label: 'Serviços', href: '#servicos', hasDropdown: false },
    { label: 'Projetos', href: '#projetos', hasDropdown: false },
    { label: 'Processo', href: '#processo', hasDropdown: false },
    { label: 'Contato', href: '#contato', hasDropdown: false },
  ]

  const handleNavClick = (href: string, label: string) => {
    setActiveSection(label.toLowerCase())
    setIsMobileMenuOpen(false)
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const whatsappUrl = formatWhatsAppLink(whatsapp, 'Olá! Gostaria de conversar sobre um projeto com a ANXIS.')

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 transition-all duration-300 pointer-events-none">
      {/* FLOATING WHITE CAPSULE / PILL NAVBAR CONTAINER */}
      <div
        className={cn(
          'max-w-7xl mx-auto bg-white/95 backdrop-blur-xl rounded-full px-5 py-2.5 sm:py-3 border border-slate-200/90 shadow-xl shadow-slate-900/5 flex items-center justify-between pointer-events-auto transition-all duration-300',
          isScrolled ? 'shadow-2xl shadow-slate-900/10 border-slate-300/90 py-2 sm:py-2.5 bg-white/98' : ''
        )}
      >
        {/* LOGO WITH COLORFUL 4-RAY ICON & TYPOGRAPHY */}
        <Link href="/" className="relative z-10 flex items-center cursor-pointer">
          <AnxisLogo size="md" theme="light" />
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = activeSection === link.label.toLowerCase() || (link.label === 'Home' && activeSection === 'home')
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(link.href, link.label)
                }}
                className={cn(
                  'text-xs sm:text-sm font-bold transition-all py-1 cursor-pointer relative group',
                  isActive ? 'text-[#0F172A]' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] rounded-full" />
                )}
              </a>
            )
          })}
        </nav>

        {/* DESKTOP ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-3">
          {/* SEARCH BUTTON */}
          <button
            type="button"
            onClick={() => handleNavClick('#projetos', 'Projetos')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-inner"
            title="Buscar Projetos"
          >
            <Icon name="Search" size={16} />
          </button>

          {/* CTA TALK BUTTON WITH BRAND MULTI-COLOR GRADIENT */}
          <a
            href="#contato"
            onClick={(e) => {
              e.preventDefault()
              trackEvent('click_primary_cta', { location: 'header' })
              handleNavClick('#contato', 'Contato')
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] hover:opacity-90 shadow-md shadow-slate-900/10 hover:shadow-lg transition-all cursor-pointer group"
          >
            <span>{ctaLabel}</span>
            <Icon name="ArrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative z-50 p-2 text-slate-900 focus:outline-none cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
        </button>
      </div>

      {/* MOBILE MENU SHEET OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden pointer-events-auto fixed inset-0 z-40 bg-[#FFFFFF]/98 backdrop-blur-xl flex flex-col justify-between p-6 pt-24 text-slate-900 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="space-y-6">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(link.href, link.label)
                  }}
                  className="text-xl font-bold text-slate-900 hover:text-slate-600 transition-colors border-b border-slate-100 pb-3"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault()
                trackEvent('click_primary_cta', { location: 'mobile_menu' })
                handleNavClick('#contato', 'Contato')
              }}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full text-base font-extrabold text-white bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] shadow-lg transition-all"
            >
              <span>{ctaLabel}</span>
              <Icon name="ArrowRight" size={18} className="ml-2" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_whatsapp', { location: 'mobile_menu' })}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Icon name="MessageSquare" size={18} className="mr-2 text-emerald-600" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
