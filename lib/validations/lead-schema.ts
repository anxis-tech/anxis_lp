import { z } from 'zod'

export const leadFormSchema = z.object({
  name: z.string().min(2, { message: 'Por favor, informe seu nome completo.' }),
  company: z.string().optional(),
  email: z.string().email({ message: 'Informe um endereço de e-mail válido.' }),
  whatsapp: z.string().min(10, { message: 'Informe um WhatsApp válido com DDD.' }),
  project_type: z.string().min(1, { message: 'Selecione o tipo de projeto.' }),
  current_platform: z.string().optional(),
  budget_range: z.string().optional(),
  desired_deadline: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'É necessário concordar com o contato comercial.',
  }),
  // Antispam Honeypot field (hidden from real users)
  website_hp: z.string().max(0, { message: 'Spam detectado.' }).optional(),
})

export type LeadFormData = z.infer<typeof leadFormSchema>
