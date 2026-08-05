import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { HeroSection } from '@/components/sections/hero-section'
import { CredibilityBar } from '@/components/sections/credibility-bar'
import { ServicesSection } from '@/components/sections/services-section'
import { PortfolioSection } from '@/components/sections/portfolio-section'
import { TechMarquee } from '@/components/sections/tech-marquee'
import { Differentiators } from '@/components/sections/differentiators'
import { ProcessSection } from '@/components/sections/process-section'
import { CustomSolution } from '@/components/sections/custom-solution'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { FAQSection } from '@/components/sections/faq-section'
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

      <main className="min-h-screen bg-[#F7F8FA] text-[#0C1D36] antialiased selection:bg-[#0075FF] selection:text-white">
        {/* 1. HEADER */}
        <Header whatsapp={settings.whatsapp} ctaLabel={settings.primary_cta_label} />

        {/* 2. HERO SECTION */}
        <HeroSection primaryCtaText={settings.primary_cta_label} />

        {/* 3. FAIXA DE CREDIBILIDADE */}
        <CredibilityBar />

        {/* 4. SERVIÇOS */}
        <ServicesSection services={services} />

        {/* 5. PROJETOS EM DESTAQUE */}
        <PortfolioSection projects={projects} />

        {/* 6. TECNOLOGIAS E PLATAFORMAS (MARQUEE) */}
        <TechMarquee technologies={technologies} />

        {/* 7. DIFERENCIAIS */}
        <Differentiators />

        {/* 8. PROCESSO DE TRABALHO */}
        <ProcessSection />

        {/* 9. SOLUÇÃO PERSONALIZADA */}
        <CustomSolution />

        {/* 10. DEPOIMENTOS */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 11. PERGUNTAS FREQUENTES */}
        <FAQSection faqs={faqs} />

        {/* 12. CTA FINAL */}
        <CTASection whatsapp={settings.whatsapp} />

        {/* 13. FORMULÁRIO DE CONTATO */}
        <ContactForm />

        {/* 14. FOOTER */}
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
