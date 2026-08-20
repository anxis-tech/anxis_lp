export interface SiteSettings {
  id?: string
  company_name: string
  logo_light_url: string
  logo_dark_url: string
  email: string
  phone: string
  whatsapp: string
  address: string
  social_links: {
    instagram?: string
    linkedin?: string
    facebook?: string
  }
  primary_cta_label?: string
  primary_cta_url?: string
  gtm_id?: string
  meta_pixel_id?: string
  google_ads_id?: string
  custom_head_code?: string
  custom_body_code?: string
  created_at?: string
  updated_at?: string
}

export interface PageSection {
  id: string
  section_key: string
  title: string
  eyebrow?: string
  description?: string
  content_json?: Record<string, any>
  display_order: number
  is_visible?: boolean
  updated_at?: string
}

export interface Project {
  id: string
  title: string
  client?: string
  slug?: string
  category: 'institucional' | 'e-commerce' | 'landing-page' | 'personalizado'
  short_description: string
  full_description?: string
  desktop_image_url: string
  mobile_image_url?: string
  client_logo_url?: string
  project_url?: string
  button_label?: string
  open_new_tab?: boolean
  technologies: string[]
  year?: string
  accent_color?: string
  image_alt?: string
  is_featured: boolean
  is_visible: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface Technology {
  id: string
  name: string
  logo_url: string
  category: string
  website_url?: string
  image_alt?: string
  is_visible?: boolean
  display_order?: number
  created_at?: string
  updated_at?: string
}

export interface ServiceItem {
  id: string
  title: string
  description: string
  icon: string
  benefits: string[]
  link?: string
  is_visible?: boolean
  display_order?: number
}

export interface Testimonial {
  id: string
  name: string
  company: string
  role?: string
  photo_url?: string
  headline?: string
  content: string
  rating?: number
  related_project_id?: string
  is_visible?: boolean
  display_order?: number
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  is_visible?: boolean
  display_order?: number
}

export interface Lead {
  id: string
  name: string
  company?: string
  email: string
  whatsapp: string
  project_type: string
  current_platform?: string
  budget_range?: string
  desired_deadline?: string
  message?: string
  consent: boolean
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  landing_page?: string
  referrer?: string
  status?: 'novo' | 'em_atendimento' | 'convertido' | 'arquivado'
  created_at: string
}
