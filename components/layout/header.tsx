'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, ArrowRight, MessageSquare } from 'lucide-react'
import { cn, formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface HeaderProps {
  phone?: string
  whatsapp?: string
  ctaLabel?: string
}

export function Header({ whatsapp = '5511999999999', ctaLabel = 'Solicitar proposta' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
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
    { label: 'Serviços', href: '#servicos' },
    { label: 'Projetos', href: '#projetos' },
    { label: 'Tecnologias', href: '#tecnologias' },
    { label: 'Diferenciais', href: '#diferenciais' },
    { label: 'Processo', href: '#processo' },
    { label: 'Contato', href: '#contato' },
  ]

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false)
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
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="relative z-10 flex items-center gap-2 group">
          <div className="relative w-36 h-9 sm:w-40 sm:h-10 transition-transform duration-200 group-hover:scale-[1.02]">
            <Image
              src="/images/logo-transparente.png"
              alt="ANXIS - Desenvolvimento de Sites e Lojas Virtuais"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(link.href)
              }}
              className="text-sm font-medium text-[#0C1D36] hover:text-[#0075FF] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#0075FF] hover:after:w-full after:transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* DESKTOP CTA BUTTON */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_whatsapp', { location: 'header' })}
            className="text-slate-600 hover:text-[#0075FF] transition-colors p-2 rounded-full hover:bg-slate-100"
            title="Atendimento via WhatsApp"
          >
            <MessageSquare className="w-5 h-5" />
          </a>

          <a
            href="#contato"
            onClick={(e) => {
              e.preventDefault()
              trackEvent('click_primary_cta', { location: 'header' })
              handleNavClick('#contato')
            }}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md hover:shadow-glow-blue transition-all duration-200 active:scale-[0.98]"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative z-50 p-2 text-[#0C1D36] hover:text-[#0075FF] focus:outline-none"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* MOBILE MENU SHEET OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col justify-between p-6 pt-24 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="space-y-6">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(link.href)
                  }}
                  className="text-xl font-bold text-[#0C1D36] hover:text-[#0075FF] transition-colors border-b border-slate-100 pb-3"
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
                handleNavClick('#contato')
              }}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg transition-all"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_whatsapp', { location: 'mobile_menu' })}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-[#081D3A] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2 text-emerald-600" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
