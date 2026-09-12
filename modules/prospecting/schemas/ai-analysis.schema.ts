import { z } from 'zod'
export const aiAnalysisSchema = z.object({
  opportunityType: z.enum([
    'website',
    'redesign',
    'software',
    'automation',
    'website_and_software',
  ]),
  commercialPotential: z.enum(['low', 'medium', 'high']),
  mainProblem: z.string().min(1).max(1200),
  recommendedSolution: z.string().min(1).max(1600),
  salesAngle: z.string().min(1).max(1200),
  summary: z.string().min(1).max(1600),
  confidence: z.number().min(0).max(1),
})
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>
