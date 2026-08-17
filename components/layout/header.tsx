'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisLogo } from '@/components/ui/anxis-logo'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { cn, formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface HeaderProps {
  phone?: string
  whatsapp?: string
  ctaLabel?: string
}

export function Header({ whatsapp = '5511999999999' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const navLinks = [
    { label: 'Home', href: '#', id: 'home' },
    { label: 'Serviços', href: '#servicos', id: 'servicos' },
    { label: 'Projetos', href: '#projetos', id: 'projetos' },
    { label: 'Processo', href: '#processo', id: 'processo' },
    { label: 'Contato', href: '#contato', id: 'contato' },
  ]

  const handleNavClick = (href: string, label: string) => {
    setActiveSection(label.toLowerCase())
    setIsMenuOpen(false)
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
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div ref={menuRef} className="max-w-4xl mx-auto relative pointer-events-auto">
        {/* WHITE TRANSLUCENT CAPSULE NAVBAR */}
        <div
          className={cn(
            'w-full bg-white/70 backdrop-blur-md border border-white/80 rounded-[20px] px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 flex items-center justify-between transition-all duration-300',
            isScrolled ? 'bg-white/85 backdrop-blur-lg border-slate-200/80 shadow-xl shadow-slate-900/10 py-1.5 sm:py-2' : ''
          )}
        >
          {/* LEFT: MENU BUTTON */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu de navegação"
            className={cn(
              'flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[20px] bg-slate-100/70 hover:bg-slate-200/80 backdrop-blur-xs text-slate-800 border border-slate-200/60 transition-all cursor-pointer select-none group',
              isMenuOpen ? 'bg-slate-200/90 border-slate-300 ring-1 ring-slate-300' : ''
            )}
          >
            <div className="flex flex-col justify-center items-center w-4 h-3.5 gap-1">
              <span
                className={cn(
                  'h-0.5 w-4 bg-slate-800 rounded-full transition-transform duration-200',
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                )}
              />
              <span
                className={cn(
                  'h-0.5 w-3 self-start bg-slate-800 rounded-full transition-opacity duration-200',
                  isMenuOpen ? 'opacity-0' : ''
                )}
              />
              <span
                className={cn(
                  'h-0.5 w-4 bg-slate-800 rounded-full transition-transform duration-200',
                  isMenuOpen ? '-rotate-45 -translate-y-1' : ''
                )}
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-800 group-hover:text-slate-950">
              Menu
            </span>
          </button>

          {/* CENTER: ANXIS LOGO */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault()
                handleNavClick('#', 'Home')
              }}
              className="flex items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <AnxisLogo size="md" theme="light" className="scale-90 sm:scale-100" />
            </Link>
          </div>

          {/* RIGHT: CTA CONTATO BUTTON (RAINBOW BRAND GRADIENT) */}
          <div className="flex items-center">
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault()
                trackEvent('click_primary_cta', { location: 'header' })
                handleNavClick('#contato', 'Contato')
              }}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 rounded-[20px] text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#086ec5] to-[#0a7ee0] hover:opacity-95 active:scale-95 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Contato
            </a>
          </div>
        </div>

        {/* VERTICALLY EXPANDING MENU (ANCHORED ON THE LEFT) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 top-[calc(100%+8px)] w-64 sm:w-72 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[20px] p-2.5 sm:p-3 shadow-2xl shadow-slate-900/10 z-50 flex flex-col gap-1 overflow-hidden"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navegação
              </div>

              <nav className="flex flex-col gap-0.5">
                {navLinks.map((link) => {
                  const isActive =
                    activeSection === link.label.toLowerCase() ||
                    (link.label === 'Home' && activeSection === 'home')
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault()
                        handleNavClick(link.href, link.label)
                      }}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-xs sm:text-sm font-medium transition-all cursor-pointer group',
                        isActive
                          ? 'bg-slate-100 text-[#0F172A] font-semibold'
                          : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
                      )}
                    >
                      <span>{link.label}</span>
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#086ec5] shadow-xs" />
                      ) : (
                        <Icon
                          name="ArrowRight"
                          size={13}
                          className="opacity-0 group-hover:opacity-60 transition-opacity text-slate-400"
                        />
                      )}
                    </a>
                  )
                })}
              </nav>

              {/* WHATSAPP ACTION BUTTON IN DROPDOWN */}
              <div className="pt-2 mt-1 border-t border-slate-100">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent('click_whatsapp', { location: 'menu_dropdown' })
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-[14px] text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] fill-current" />
                  <span>Conversar no WhatsApp</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

