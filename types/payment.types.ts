export type PaymentStatus =
  | 'Pendente'
  | 'Pago'
  | 'Falha na geração'
  | 'Falha na confirmação'

export interface Payment {
  id: string
  project_id: string
  quote_id?: string | null
  contract_id?: string | null
  provider: string
  order_nsu: string
  status: PaymentStatus
  expected_amount: number // in cents
  paid_amount: number // in cents
  payment_url?: string | null
  invoice_slug?: string | null
  transaction_nsu?: string | null
  capture_method?: string | null
  installments?: number
  receipt_url?: string | null
  provider_response?: any
  generated_by?: string | null
  generated_at: string
  paid_at?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface PaymentWebhookEvent {
  id: string
  provider: string
  order_nsu?: string | null
  transaction_nsu?: string | null
  event_payload: any
  processing_status: 'pending' | 'processed' | 'failed' | 'duplicate'
  received_at: string
  processed_at?: string | null
  attempts: number
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface InfinitePayCreateLinkPayload {
  handle: string
  redirect_url: string
  webhook_url: string
  order_nsu: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  items: Array<{
    description: string
    quantity: number
    price: number // in cents
  }>
}

export interface InfinitePayCheckPayload {
  handle: string
  order_nsu: string
  transaction_nsu?: string
  slug?: string
}
