'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Payment, PaymentStatus } from '@/types/payment.types'
import { revalidatePath } from 'next/cache'
import { logAuditEventAction } from '@/lib/actions/audit'
import { headers } from 'next/headers'

// Helper to resolve base URL securely
async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') || 'https'
    if (host) return `${proto}://${host}`
  } catch (err) {
    console.warn('Could not read request headers for base URL:', err)
  }
  return 'https://anxis.tech'
}

// ──────────────────────────────────────────────
// 1. GET PAYMENT BY PROJECT ID
// ──────────────────────────────────────────────
export async function getPaymentByProjectIdAction(projectId: string): Promise<Payment | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as Payment
}

// ──────────────────────────────────────────────
// 2. CREATE INFINITEPAY PAYMENT LINK
// ──────────────────────────────────────────────
export async function createPaymentLinkAction(params: {
  projectId: string
  contractId?: string
  createdBy?: string
}) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) {
    console.error('INFINITEPAY_HANDLE is missing in environment variables.')
    return {
      success: false,
      message: 'Configuração da InfinitePay ausente no servidor (INFINITEPAY_HANDLE não configurado).',
    }
  }

  // Sanitize handle (remove $ if present)
  const sanitizedHandle = handle.replace(/^\$/, '').trim()

  const adminSupabase = createAdminClient()

  // Fetch project record from DB
  const { data: project, error: projErr } = await adminSupabase
    .from('client_projects')
    .select('*')
    .eq('id', params.projectId)
    .single()

  if (projErr || !project) {
    return { success: false, message: 'Projeto não encontrado no banco de dados.' }
  }

  // Fetch or confirm completed contract
  let contractId = params.contractId
  if (!contractId) {
    const { data: latestContract } = await adminSupabase
      .from('contracts')
      .select('id, status')
      .eq('project_id', params.projectId)
      .eq('status', 'completed')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestContract) {
      return {
        success: false,
        message: 'Não é possível gerar o link de pagamento: O contrato em PDF ainda não foi gerado ou concluído.',
      }
    }
    contractId = latestContract.id
  } else {
    const { data: targetContract } = await adminSupabase
      .from('contracts')
      .select('id, status')
      .eq('id', contractId)
      .single()

    if (!targetContract || targetContract.status !== 'completed') {
      return {
        success: false,
        message: 'Não é possível gerar o link de pagamento: O contrato fornecido ainda não está concluído.',
      }
    }
  }

  // Check for active existing payment for this project
  const { data: existingPayment } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('project_id', params.projectId)
    .eq('status', 'Pendente')
    .limit(1)
    .maybeSingle()

  if (existingPayment && existingPayment.payment_url) {
    return {
      success: true,
      payment: existingPayment as Payment,
      paymentUrl: existingPayment.payment_url,
      message: 'Link de pagamento ativo já gerado anteriormente.',
    }
  }

  // Validate approved value in cents
  const approvedValue = Number(project.approved_value || 0)
  if (!approvedValue || approvedValue <= 0) {
    return {
      success: false,
      message: 'Valor aprovado do projeto inválido ou menor que zero. Não é possível gerar cobrança.',
    }
  }

  // Convert to integer cents (R$ 1.500,00 -> 150000)
  const amountCents = Math.round(approvedValue * 100)

  // Generate unique order_nsu
  const shortId = params.projectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  const orderNsu = `nsu-${shortId}-${Date.now()}`

  // Customer contact details
  const contactJson = project.client_contact_json || {}
  const customerName = contactJson.contact_name || project.client_name || 'Cliente'
  const customerEmail = contactJson.email || project.email || ''
  const rawPhone = contactJson.phone || project.phone || project.whatsapp || ''
  const cleanPhone = rawPhone.replace(/\D/g, '')

  const baseUrl = await getBaseUrl()
  const redirectUrl = `${baseUrl}/pagamento/retorno`
  const webhookUrl = `${baseUrl}/api/webhooks/infinitepay`

  // Build InfinitePay official create link payload
  const createLinkPayload = {
    handle: sanitizedHandle,
    redirect_url: redirectUrl,
    webhook_url: webhookUrl,
    order_nsu: orderNsu,
    customer: {
      name: customerName,
      email: customerEmail || undefined,
      phone: cleanPhone || undefined,
    },
    items: [
      {
        description: `Desenvolvimento de site — ${project.title || 'Projeto'}`,
        quantity: 1,
        price: amountCents,
      },
    ],
  }

  console.log('Sending InfinitePay create link request:', JSON.stringify(createLinkPayload, null, 2))

  try {
    const apiRes = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createLinkPayload),
    })

    const resJson = await apiRes.json()

    if (!apiRes.ok || (!resJson.url && !resJson.checkout_url && !resJson.link && !resJson.slug)) {
      console.error('InfinitePay API error response:', apiRes.status, resJson)
      const errorMsg = resJson.message || resJson.error || `Erro HTTP ${apiRes.status} ao conectar à InfinitePay.`

      // Record failed payment attempt
      await adminSupabase.from('payments').insert({
        project_id: params.projectId,
        quote_id: project.quote_id || null,
        contract_id: contractId,
        provider: 'infinitepay',
        order_nsu: orderNsu,
        status: 'Falha na geração',
        expected_amount: amountCents,
        paid_amount: 0,
        provider_response: resJson,
        generated_by: user.id,
        error_message: errorMsg,
      })

      return { success: false, message: `Falha ao gerar link na InfinitePay: ${errorMsg}` }
    }

    // Extract official response fields
    const paymentUrl = resJson.url || resJson.checkout_url || resJson.link || `https://checkout.infinitepay.io/${resJson.slug}`
    const invoiceSlug = resJson.slug || resJson.invoice_slug || resJson.id || null

    // Save payment record in DB
    const { data: newPayment, error: insertErr } = await adminSupabase
      .from('payments')
      .insert({
        project_id: params.projectId,
        quote_id: project.quote_id || null,
        contract_id: contractId,
        provider: 'infinitepay',
        order_nsu: orderNsu,
        status: 'Pendente',
        expected_amount: amountCents,
        paid_amount: 0,
        payment_url: paymentUrl,
        invoice_slug: invoiceSlug,
        provider_response: resJson,
        generated_by: user.id,
        generated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (insertErr) {
      console.error('Error inserting payment record:', insertErr)
    }

    // Update project with payment link & status
    await adminSupabase
      .from('client_projects')
      .update({
        payment_status: 'Pendente',
        payment_link: paymentUrl,
      })
      .eq('id', params.projectId)

    await logAuditEventAction({
      action: 'create_payment_link',
      module: 'payments',
      recordId: newPayment?.id || orderNsu,
      newData: { order_nsu: orderNsu, amount: approvedValue, payment_url: paymentUrl },
    })

    revalidatePath('/admin')
    return {
      success: true,
      payment: newPayment as Payment,
      paymentUrl: paymentUrl,
      message: 'Link de pagamento gerado com sucesso via InfinitePay!',
    }
  } catch (err: any) {
    console.error('Network exception connecting to InfinitePay API:', err)
    return {
      success: false,
      message: `Erro de conexão com o servidor da InfinitePay: ${err?.message || 'Falha de rede.'}`,
    }
  }
}

// ──────────────────────────────────────────────
// 3. CHECK PAYMENT STATUS (payment_check endpoint)
// ──────────────────────────────────────────────
export async function checkPaymentStatusAction(orderNsuOrPaymentId: string) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: 'Usuário não autenticado.' }
  }

  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) {
    return { success: false, message: 'INFINITEPAY_HANDLE não configurado no servidor.' }
  }
  const sanitizedHandle = handle.replace(/^\$/, '').trim()

  const adminSupabase = createAdminClient()

  // Find payment record in DB by id or order_nsu
  let { data: payment } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('id', orderNsuOrPaymentId)
    .maybeSingle()

  if (!payment) {
    const { data: byNsu } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('order_nsu', orderNsuOrPaymentId)
      .maybeSingle()
    payment = byNsu
  }

  if (!payment) {
    return { success: false, message: 'Registro de pagamento não encontrado.' }
  }

  // Official payment_check payload
  const checkPayload = {
    handle: sanitizedHandle,
    order_nsu: payment.order_nsu,
    transaction_nsu: payment.transaction_nsu || undefined,
    slug: payment.invoice_slug || undefined,
  }

  console.log('Sending InfinitePay payment_check request:', JSON.stringify(checkPayload, null, 2))

  try {
    const apiRes = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkPayload),
    })

    const resJson = await apiRes.json()

    // Confirm official verification fields: success === true AND paid === true
    const isPaid = resJson.success === true && (resJson.paid === true || resJson.status === 'paid' || resJson.status === 'completed')

    if (isPaid) {
      const paidAmount = Number(resJson.paid_amount || resJson.amount || payment.expected_amount)
      const paidAt = resJson.paid_at || new Date().toISOString()
      const transactionNsu = resJson.transaction_nsu || resJson.nsu || payment.order_nsu
      const receiptUrl = resJson.receipt_url || resJson.receipt || null
      const captureMethod = resJson.capture_method || resJson.payment_method || 'InfinitePay'
      const installments = resJson.installments || 1

      // Update payment record in DB
      const { data: updatedPayment } = await adminSupabase
        .from('payments')
        .update({
          status: 'Pago',
          paid_amount: paidAmount,
          paid_at: paidAt,
          transaction_nsu: transactionNsu,
          receipt_url: receiptUrl,
          capture_method: captureMethod,
          installments: installments,
          provider_response: resJson,
        })
        .eq('id', payment.id)
        .select('*')
        .single()

      // Update client_projects with payment status
      await adminSupabase
        .from('client_projects')
        .update({
          payment_status: 'Pago',
          paid_value: paidAmount / 100,
        })
        .eq('id', payment.project_id)

      await logAuditEventAction({
        action: 'confirm_payment',
        module: 'payments',
        recordId: payment.id,
        newData: { order_nsu: payment.order_nsu, paid_amount: paidAmount },
      })

      revalidatePath('/admin')
      return {
        success: true,
        isPaid: true,
        payment: updatedPayment as Payment,
        message: 'Pagamento confirmado e registrado com sucesso!',
      }
    } else {
      return {
        success: true,
        isPaid: false,
        payment: payment as Payment,
        message: 'O pagamento ainda consta como pendente na InfinitePay.',
      }
    }
  } catch (err: any) {
    console.error('Error during InfinitePay payment_check:', err)
    return {
      success: false,
      message: `Erro de comunicação na consulta do pagamento: ${err?.message || 'Falha de rede.'}`,
    }
  }
}
