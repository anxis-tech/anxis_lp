import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  let payload: any = {}
  try {
    payload = await req.json()
  } catch (err) {
    console.error('Webhook payload JSON parse error:', err)
    return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 })
  }

  console.log('Received InfinitePay Webhook Payload:', JSON.stringify(payload, null, 2))

  const handle = process.env.INFINITEPAY_HANDLE
  const sanitizedHandle = handle ? handle.replace(/^\$/, '').trim() : ''

  const orderNsu = payload.order_nsu || payload.order_id || payload.nsu || null
  const transactionNsu = payload.transaction_nsu || payload.transaction_id || payload.nsu || null
  const invoiceSlug = payload.invoice_slug || payload.slug || payload.id || null

  const adminSupabase = createAdminClient()

  // 1. Audit raw event in payment_webhook_events table
  let webhookEventId: string | null = null
  try {
    const { data: eventRecord, error: auditErr } = await adminSupabase
      .from('payment_webhook_events')
      .insert({
        provider: 'infinitepay',
        order_nsu: orderNsu,
        transaction_nsu: transactionNsu,
        event_payload: payload,
        processing_status: 'pending',
        attempts: 1,
      })
      .select('id')
      .single()

    if (!auditErr && eventRecord) {
      webhookEventId = eventRecord.id
    }
  } catch (err) {
    console.warn('Could not insert webhook event audit log:', err)
  }

  // 2. Locate target payment in DB
  if (!orderNsu && !transactionNsu && !invoiceSlug) {
    if (webhookEventId) {
      await adminSupabase.from('payment_webhook_events').update({
        processing_status: 'failed',
        last_error: 'Missing order_nsu or transaction_nsu in webhook payload',
      }).eq('id', webhookEventId)
    }
    return NextResponse.json({ success: false, message: 'Missing order_nsu identifier' }, { status: 200 })
  }

  let paymentRecord: any = null
  if (orderNsu) {
    const { data: p } = await adminSupabase.from('payments').select('*').eq('order_nsu', orderNsu).maybeSingle()
    paymentRecord = p
  }
  if (!paymentRecord && transactionNsu) {
    const { data: p } = await adminSupabase.from('payments').select('*').eq('transaction_nsu', transactionNsu).maybeSingle()
    paymentRecord = p
  }
  if (!paymentRecord && invoiceSlug) {
    const { data: p } = await adminSupabase.from('payments').select('*').eq('invoice_slug', invoiceSlug).maybeSingle()
    paymentRecord = p
  }

  if (!paymentRecord) {
    console.warn(`Payment record not found for order_nsu: ${orderNsu}`)
    if (webhookEventId) {
      await adminSupabase.from('payment_webhook_events').update({
        processing_status: 'failed',
        last_error: `Payment record not found for order_nsu: ${orderNsu}`,
      }).eq('id', webhookEventId)
    }
    return NextResponse.json({ success: true, message: 'Payment record not found in system' }, { status: 200 })
  }

  // 3. Idempotency Check: If already marked as 'Pago', return success without duplicating
  if (paymentRecord.status === 'Pago') {
    console.log(`Payment order_nsu ${orderNsu} is already marked as Pago. Idempotent return.`)
    if (webhookEventId) {
      await adminSupabase.from('payment_webhook_events').update({
        processing_status: 'duplicate',
        processed_at: new Date().toISOString(),
      }).eq('id', webhookEventId)
    }
    return NextResponse.json({ success: true, message: 'Payment already processed and marked as paid' }, { status: 200 })
  }

  // 4. Server-to-Server Verification (payment_check endpoint)
  try {
    const checkPayload = {
      handle: sanitizedHandle,
      order_nsu: paymentRecord.order_nsu,
      transaction_nsu: transactionNsu || paymentRecord.transaction_nsu || undefined,
      slug: invoiceSlug || paymentRecord.invoice_slug || undefined,
    }

    console.log('Sending InfinitePay payment_check from Webhook:', JSON.stringify(checkPayload, null, 2))

    const apiRes = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload),
    })

    const resJson = await apiRes.json()
    console.log('InfinitePay payment_check webhook verification response:', resJson)

    const isPaid = resJson.success === true && (resJson.paid === true || resJson.status === 'paid' || resJson.status === 'completed')

    if (isPaid) {
      const paidAmount = Number(resJson.paid_amount || resJson.amount || payload.paid_amount || payload.amount || paymentRecord.expected_amount)
      const paidAt = resJson.paid_at || payload.paid_at || new Date().toISOString()
      const finalTxNsu = resJson.transaction_nsu || transactionNsu || paymentRecord.order_nsu
      const receiptUrl = resJson.receipt_url || payload.receipt_url || null
      const captureMethod = resJson.capture_method || payload.capture_method || 'InfinitePay'
      const installments = resJson.installments || payload.installments || 1

      // Update payments table to 'Pago'
      await adminSupabase.from('payments').update({
        status: 'Pago',
        paid_amount: paidAmount,
        paid_at: paidAt,
        transaction_nsu: finalTxNsu,
        receipt_url: receiptUrl,
        capture_method: captureMethod,
        installments: installments,
        provider_response: resJson,
      }).eq('id', paymentRecord.id)

      // Update client_projects table to 'Pago'
      await adminSupabase.from('client_projects').update({
        payment_status: 'Pago',
        paid_value: paidAmount / 100,
      }).eq('id', paymentRecord.project_id)

      if (webhookEventId) {
        await adminSupabase.from('payment_webhook_events').update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
        }).eq('id', webhookEventId)
      }

      revalidatePath('/admin')
      return NextResponse.json({ success: true, message: 'Payment verified and updated to Pago' }, { status: 200 })
    } else {
      console.warn(`Payment check returned unconfirmed status for order_nsu: ${orderNsu}`)
      if (webhookEventId) {
        await adminSupabase.from('payment_webhook_events').update({
          processing_status: 'pending',
          last_error: 'Payment_check returned unconfirmed status',
        }).eq('id', webhookEventId)
      }
      return NextResponse.json({ success: true, message: 'Payment check unconfirmed' }, { status: 200 })
    }
  } catch (err: any) {
    console.error('Error during webhook payment verification:', err)
    if (webhookEventId) {
      await adminSupabase.from('payment_webhook_events').update({
        processing_status: 'failed',
        last_error: err?.message || 'Verification network error',
      }).eq('id', webhookEventId)
    }
    return NextResponse.json({ success: false, message: 'Error processing webhook' }, { status: 200 })
  }
}
