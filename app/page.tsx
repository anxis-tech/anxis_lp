import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { HeroSection } from '@/components/sections/hero-section'
import { TechMarquee } from '@/components/sections/tech-marquee'
import { PerformanceImpactSection } from '@/components/sections/performance-impact-section'
import { ProjectPreviewBar } from '@/components/sections/project-preview-bar'
import { ProcessSection } from '@/components/sections/process-section'
import { PillarsGridSection } from '@/components/sections/pillars-grid-section'
import { CustomSolution } from '@/components/sections/custom-solution'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { CTASection } from '@/components/sections/cta-section'
import { ContactForm } from '@/components/sections/contact-form'
import { Footer } from '@/components/layout/footer'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { AnalyticsScript } from '@/components/layout/analytics-script'
import { createClient } from '@/lib/supabase/server'
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_PROJECTS,
  INITIAL_TECHNOLOGIES,
  INITIAL_TESTIMONIALS,
  INITIAL_FAQS,
} from '@/lib/constants/initial-data'

export const revalidate = 60 // Revalidate cache every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ANXIS | Desenvolvimento de Sites, Lojas Virtuais e Soluções Digitais',
    description:
      'A ANXIS cria sites institucionais, lojas virtuais (Tray, Nuvemshop, WooCommerce) e projetos personalizados em código com foco em desempenho, experiência e conversão.',
    keywords: [
      'desenvolvimento de sites',
      'criação de lojas virtuais',
      'e-commerce tray',
      'desenvolvimento nuvemshop',
      'landing page alta conversao',
      'programação sob medida',
      'agencia desenvolvimento web',
      'next.js agencia',
    ],
    authors: [{ name: 'ANXIS' }],
    creator: 'ANXIS Digital',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://anxis.com.br'),
    openGraph: {
      title: 'ANXIS | Desenvolvimento de Sites e Lojas Virtuais',
      description: 'Projetos digitais desenvolvidos para apresentar, vender e crescer.',
      url: 'https://anxis.com.br',
      siteName: 'ANXIS',
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'ANXIS Desenvolvimento Digital',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ANXIS | Desenvolvimento Digital',
      description: 'Projetos digitais desenvolvidos para apresentar, vender e crescer.',
    },
  }
}

export default async function HomePage() {
  let settings = INITIAL_SITE_SETTINGS
  let services = INITIAL_SERVICES
  let projects = INITIAL_PROJECTS
  let technologies = INITIAL_TECHNOLOGIES
  let testimonials = INITIAL_TESTIMONIALS
  let faqs = INITIAL_FAQS

  // Fetch live content from Supabase if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()

      const [
        { data: settingsData },
        { data: servicesData },
        { data: projectsData },
        { data: techData },
        { data: testimonialsData },
        { data: faqsData },
      ] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('services').select('*').order('display_order', { ascending: true }),
        supabase.from('projects').select('*').order('display_order', { ascending: true }),
        supabase.from('technologies').select('*').order('display_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('display_order', { ascending: true }),
        supabase.from('faq_items').select('*').order('display_order', { ascending: true }),
      ])

      if (settingsData) settings = { ...INITIAL_SITE_SETTINGS, ...settingsData }
      if (servicesData && servicesData.length > 0) services = servicesData
      if (projectsData && projectsData.length > 0) projects = projectsData
      if (techData && techData.length > 0) technologies = techData
      if (testimonialsData && testimonialsData.length > 0) testimonials = testimonialsData
      if (faqsData && faqsData.length > 0) faqs = faqsData
    } catch (e) {
      console.warn('Supabase not connected yet. Serving initial fallback data.')
    }
  }

  // Schema.org Structured Data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: settings.company_name,
    url: 'https://anxis.com.br',
    logo: 'https://anxis.com.br/images/logo-transparente.png',
    image: 'https://anxis.com.br/images/og-image.jpg',
    description:
      'Empresa especializada em desenvolvimento de sites institucionais, lojas virtuais e projetos personalizados.',
    telephone: settings.phone,
    email: settings.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    priceRange: '$$$',
  }

  return (
    <>
      {/* Schema.org Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Analytics Tracking Scripts (GTM / Meta Pixel) */}
      <AnalyticsScript
        gtmId={settings.gtm_id}
        metaPixelId={settings.meta_pixel_id}
        googleAdsId={settings.google_ads_id}
      />

      <main className="min-h-screen bg-[#FAFBFC] text-[#0F172A] antialiased selection:bg-[#0099FF] selection:text-white">
        {/* 1. HEADER MINIMALISTA */}
        <Header whatsapp={settings.whatsapp} ctaLabel={settings.primary_cta_label} />

        {/* 2. HERO GRANDE */}
        <HeroSection primaryCtaText={settings.primary_cta_label} />

        {/* 3. LOGOS MARQUEE (TICKER MINIMALISTA LOGO ABAIXO DA HERO) */}
        <TechMarquee technologies={technologies} />

        {/* 4. SEÇÃO DE IMPACTO DE PERFORMANCE & BARRAS COMPARATIVAS */}
        <PerformanceImpactSection />

        {/* 5. DEMONSTRAÇÃO DE PROJETOS REAIS & PORTFÓLIO CONSOLIDADO */}
        <ProjectPreviewBar projects={projects} />

        {/* 6. METODOLOGIA E PROCESSO (POSICIONADO NO LUGAR DA SEÇÃO DE SOBRE) */}
        <ProcessSection />

        {/* 7. DOBRA OFICIAL DE NOSSOS SERVIÇOS (5 CARDS: DESIGN UI/UX, DESENVOLVIMENTO, LOJAS VIRTUAIS, PERFORMANCE & SEO, BRANDING & DESIGN) */}
        <PillarsGridSection />

        {/* SOLUÇÃO PERSONALIZADA EM CÓDIGO */}
        <CustomSolution />

        {/* DEPOIMENTOS (REPOSICIONADO PARA FICAR ACIMA DA DOBRA VAMOS TRABALHAR JUNTOS) */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 8. CTA DE CONTATO - VAMOS TRABALHAR JUNTOS */}
        <CTASection whatsapp={settings.whatsapp} />

        {/* 9. UNIFIED FAQ & FORMULÁRIO DE CONTATO (50/50 SPLIT) */}
        <ContactForm faqs={faqs} whatsapp={settings.whatsapp} />

        {/* 10. FOOTER OBSIDIAN DARK */}
        <Footer
          companyName={settings.company_name}
          email={settings.email}
          phone={settings.phone}
          whatsapp={settings.whatsapp}
          address={settings.address}
          socialLinks={settings.social_links}
        />

        {/* FLOATING WHATSAPP BUTTON */}
        <WhatsAppButton whatsapp={settings.whatsapp} />
      </main>
    </>
  )
}
