'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/hugeicons'
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
    { label: 'Home', href: '#' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Projetos', href: '#projetos' },
    { label: 'Processo', href: '#processo' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Contato', href: '#contato' },
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
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled
          ? 'bg-[#FFFFFF]/95 backdrop-blur-md border-b border-slate-200 py-3.5 shadow-sm text-[#293233]'
          : 'bg-transparent py-5 text-[#293233]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO (MATCHING REFERENCE LOGO BRANDING) */}
        <Link href="/" className="relative z-10 flex items-center gap-2 group">
          <div className="relative w-36 h-9 sm:w-40 sm:h-10 transition-transform duration-200 group-hover:scale-[1.02] p-0.5">
            <Image
              src="/images/logo-transparente.png"
              alt="ANXIS - Soluções Digitais que Escalam"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS (WITH ACTIVE DOT INDICATOR LIKE REFERENCE) */}
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
                className="text-sm font-bold text-[#293233] hover:text-[#00ABB8] transition-colors relative py-1 flex flex-col items-center group cursor-pointer"
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ABB8] absolute -bottom-1" />
                )}
              </a>
            )
          })}
        </nav>

        {/* DESKTOP CTA BUTTONS (MATCHING REFERENCE PILL BUTTON & GRID MENU ICON) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#contato"
            onClick={(e) => {
              e.preventDefault()
              trackEvent('click_primary_cta', { location: 'header' })
              handleNavClick('#contato', 'Contato')
            }}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold text-[#00ABB8] border-2 border-[#00ABB8] hover:bg-[#00ABB8] hover:text-white transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <span>{ctaLabel}</span>
          </a>

          {/* GRID MENU NINE-DOT ICON BUTTON (MATCHING REFERENCE) */}
          <button
            type="button"
            onClick={() => handleNavClick('#servicos', 'Serviços')}
            className="w-10 h-10 rounded-full border border-slate-300 hover:border-[#00ABB8] hover:text-[#00ABB8] flex items-center justify-center text-slate-700 transition-all cursor-pointer bg-white"
            title="Nossos Serviços"
          >
            <div className="grid grid-cols-3 gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
            </div>
          </button>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative z-50 p-2 text-[#293233] focus:outline-none cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={28} />
        </button>
      </div>

      {/* MOBILE MENU SHEET OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#FFFFFF]/98 backdrop-blur-xl flex flex-col justify-between p-6 pt-24 text-[#293233] animate-in fade-in slide-in-from-top-4 duration-200">
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
                  className="text-xl font-bold text-[#293233] hover:text-[#00ABB8] transition-colors border-b border-slate-100 pb-3"
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
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full text-base font-extrabold text-white bg-[#00ABB8] hover:bg-[#00939E] shadow-lg transition-all"
            >
              <span>{ctaLabel}</span>
              <Icon name="ArrowRight" size={18} className="ml-2" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_whatsapp', { location: 'mobile_menu' })}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-[#293233] bg-slate-100 hover:bg-slate-200 transition-colors"
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
