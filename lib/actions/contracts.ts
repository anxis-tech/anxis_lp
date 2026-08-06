'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Contract, ContractGenerationJob } from '@/types/contract.types'
import { revalidatePath } from 'next/cache'
import { jsPDF } from 'jspdf'

// ──────────────────────────────────────────────
// 1. GET CONTRACT BY PROJECT ID
// ──────────────────────────────────────────────
export async function getContractByProjectId(projectId: string): Promise<Contract | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching contract:', error)
    return null
  }
  return data as Contract | null
}

// ──────────────────────────────────────────────
// 2. GET CONTRACT GENERATION STATUS
// ──────────────────────────────────────────────
export async function getContractGenerationStatus(contractId: string): Promise<ContractGenerationJob | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('contract_generation_jobs')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching generation job:', error)
    return null
  }
  return data as ContractGenerationJob | null
}

// ──────────────────────────────────────────────
// 3. GET CONTRACTS FOR MULTIPLE PROJECTS (batch)
// ──────────────────────────────────────────────
export async function getContractsForProjects(projectIds: string[]): Promise<Record<string, Contract>> {
  if (projectIds.length === 0) return {}
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .in('project_id', projectIds)
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching contracts batch:', error)
    return {}
  }

  const contractMap: Record<string, Contract> = {}
  for (const contract of (data || [])) {
    // Keep latest version per project
    if (!contractMap[contract.project_id]) {
      contractMap[contract.project_id] = contract as Contract
    }
  }
  return contractMap
}

// ──────────────────────────────────────────────
// 4. CREATE CONTRACT FOR PROJECT + GENERATE PDF
// ──────────────────────────────────────────────
export async function createContractForProject(projectId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  // Fetch the full project
  const { data: project, error: projErr } = await supabase
    .from('client_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projErr || !project) {
    return { success: false, message: 'Projeto não encontrado no banco de dados.' }
  }

  // Check if there's already an active contract for this project
  const { data: existing } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('project_id', projectId)
    .in('status', ['pending', 'processing', 'completed'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { success: true, contractId: existing.id, message: 'Contrato já existe para este projeto.' }
  }

  // Fetch linked quote if exists
  let quoteData: any = null
  if (project.quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', project.quote_id)
      .single()
    quoteData = quote
  }

  // Build snapshots from real data
  const clientSnapshot = {
    client_name: project.client_name,
    company: project.company,
    email: project.email,
    phone: project.phone,
    whatsapp: project.whatsapp,
    contact_name: project.client_contact_json?.contact_name || project.client_name,
    contact_role: project.client_contact_json?.role || '',
  }

  const projectSnapshot = {
    title: project.title,
    project_type: project.project_type,
    platform: project.platform,
    description: project.description,
    scope_objective: project.scope_briefing_json?.objective || '',
    target_audience: project.scope_briefing_json?.target_audience || '',
    start_date: project.start_date,
    deadline: project.deadline,
    responsible_name: project.responsible_user_name,
  }

  const pricingSnapshot = project.quote_data || (quoteData ? {
    project_type: quoteData.project_type,
    page_count: quoteData.form_data?.pageCount || 0,
    additional_page_count: quoteData.form_data?.additionalPageCount || 0,
    content_option: quoteData.form_data?.contentOption || '',
    urgency: quoteData.form_data?.urgency || '',
    base_value: quoteData.subtotal || 0,
    discount_amount: quoteData.discount || 0,
    additional_costs: quoteData.additional_costs || 0,
    tax_amount: quoteData.taxes || 0,
    final_value: quoteData.final_value || 0,
    notes: quoteData.notes || '',
  } : {})

  const finalValue = project.approved_value || pricingSnapshot.final_value || 0

  // Create contract record
  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .insert({
      project_id: projectId,
      quote_id: project.quote_id || null,
      status: 'pending',
      client_data_snapshot: clientSnapshot,
      project_data_snapshot: projectSnapshot,
      pricing_snapshot: pricingSnapshot,
      final_value: finalValue,
      version: 1,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (contractErr || !contract) {
    console.error('Error creating contract:', contractErr)
    return { success: false, message: contractErr?.message || 'Erro ao criar registro do contrato.' }
  }

  // Create generation job
  const { error: jobErr } = await supabase
    .from('contract_generation_jobs')
    .insert({
      contract_id: contract.id,
      project_id: projectId,
      status: 'pending',
      attempts: 0,
    })

  if (jobErr) {
    console.error('Error creating contract job:', jobErr)
  }

  // Trigger PDF generation (runs on the server, continues even if client disconnects)
  generateContractPdf(contract.id, projectId, clientSnapshot, projectSnapshot, pricingSnapshot, finalValue)
    .catch(err => console.error('Contract PDF generation error:', err))

  revalidatePath('/admin')
  return { success: true, contractId: contract.id }
}

// ──────────────────────────────────────────────
// 5. GENERATE CONTRACT PDF (internal)
// ──────────────────────────────────────────────
async function generateContractPdf(
  contractId: string,
  projectId: string,
  clientSnapshot: any,
  projectSnapshot: any,
  pricingSnapshot: any,
  finalValue: number
) {
  const adminSupabase = createAdminClient()

  // Update contract and job status to 'processing'
  await adminSupabase.from('contracts').update({ status: 'processing' }).eq('id', contractId)
  await adminSupabase.from('contract_generation_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString(), attempts: 1 })
    .eq('contract_id', contractId)

  try {
    // Generate PDF using jsPDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = 30

    // Helper to add text with word wrap
    const addText = (text: string, x: number, currentY: number, maxWidth: number, fontSize: number = 10, style: string = 'normal') => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', style)
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, currentY)
      return currentY + lines.length * (fontSize * 0.45)
    }

    const addSectionTitle = (title: string) => {
      if (y > 260) { doc.addPage(); y = 25 }
      doc.setDrawColor(0, 117, 255)
      doc.setFillColor(0, 117, 255)
      doc.rect(margin, y, contentWidth, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 4, y + 5.5)
      doc.setTextColor(12, 29, 54)
      y += 14
    }

    const addRow = (label: string, value: string) => {
      if (y > 275) { doc.addPage(); y = 25 }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(label, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value || 'N/A', margin + 55, y)
      y += 6
    }

    // ── HEADER ──
    doc.setFillColor(8, 29, 58)
    doc.rect(0, 0, pageWidth, 50, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATO DE PRESTAÇÃO', margin, 22)
    doc.text('DE SERVIÇOS', margin, 32)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('ANXIS Tecnologia & Desenvolvimento Web', margin, 42)
    doc.setTextColor(12, 29, 54)
    y = 60

    // ── CONTRACT ID ──
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Contrato ID: ${contractId}`, margin, y)
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 60, y)
    doc.setTextColor(12, 29, 54)
    y += 12

    // ── SECTION 1: CLIENT DATA ──
    addSectionTitle('1. DADOS DO CLIENTE (CONTRATANTE)')
    addRow('Nome / Razão Social:', clientSnapshot.client_name || '')
    addRow('Empresa:', clientSnapshot.company || '')
    addRow('E-mail:', clientSnapshot.email || '')
    addRow('Telefone:', clientSnapshot.phone || '')
    addRow('WhatsApp:', clientSnapshot.whatsapp || '')
    addRow('Contato Principal:', clientSnapshot.contact_name || '')
    addRow('Cargo:', clientSnapshot.contact_role || '')
    y += 6

    // ── SECTION 2: PROJECT DATA ──
    addSectionTitle('2. DADOS DO PROJETO')
    addRow('Nome do Projeto:', projectSnapshot.title || '')
    addRow('Tipo de Projeto:', projectSnapshot.project_type || '')
    addRow('Plataforma:', projectSnapshot.platform || '')
    addRow('Responsável:', projectSnapshot.responsible_name || '')
    addRow('Data de Início:', projectSnapshot.start_date || 'A definir')
    addRow('Prazo Final:', projectSnapshot.deadline || 'A definir')
    if (projectSnapshot.scope_objective) {
      y += 4
      y = addText(`Objetivo: ${projectSnapshot.scope_objective}`, margin, y, contentWidth, 9)
    }
    if (projectSnapshot.target_audience) {
      y += 2
      y = addText(`Público-Alvo: ${projectSnapshot.target_audience}`, margin, y, contentWidth, 9)
    }
    y += 6

    // ── SECTION 3: PRICING ──
    if (pricingSnapshot && (pricingSnapshot.final_value || finalValue)) {
      addSectionTitle('3. ESCOPO E PRECIFICAÇÃO')
      if (pricingSnapshot.project_type) addRow('Tipo:', pricingSnapshot.project_type)
      if (pricingSnapshot.page_count !== undefined) addRow('Páginas Padrão:', `${pricingSnapshot.page_count}`)
      if (pricingSnapshot.additional_page_count) addRow('Páginas Adicionais:', `${pricingSnapshot.additional_page_count}`)
      if (pricingSnapshot.content_option) addRow('Conteúdo / Copy:', pricingSnapshot.content_option)
      if (pricingSnapshot.urgency) addRow('Urgência:', pricingSnapshot.urgency)
      y += 4

      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6

      if (pricingSnapshot.base_value) addRow('Valor Base:', `R$ ${Number(pricingSnapshot.base_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      if (pricingSnapshot.discount_amount > 0) addRow('Desconto:', `- R$ ${Number(pricingSnapshot.discount_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      if (pricingSnapshot.additional_costs > 0) addRow('Custos Adicionais:', `R$ ${Number(pricingSnapshot.additional_costs).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      if (pricingSnapshot.tax_amount > 0) addRow('Impostos:', `R$ ${Number(pricingSnapshot.tax_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

      y += 4
      doc.setFillColor(240, 243, 247)
      doc.rect(margin, y - 2, contentWidth, 10, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('VALOR FINAL:', margin + 4, y + 5)
      doc.setTextColor(0, 117, 255)
      doc.text(`R$ ${Number(finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 55, y + 5)
      doc.setTextColor(12, 29, 54)
      y += 18

      if (pricingSnapshot.notes) {
        addRow('Observações:', '')
        y = addText(pricingSnapshot.notes, margin, y, contentWidth, 9)
        y += 6
      }
    }

    // ── SECTION 4: DESCRIPTION ──
    if (projectSnapshot.description) {
      addSectionTitle('4. DESCRIÇÃO GERAL')
      y = addText(projectSnapshot.description, margin, y, contentWidth, 9)
      y += 10
    }

    // ── PLACEHOLDER FOR LEGAL TEMPLATE ──
    if (y > 230) { doc.addPage(); y = 25 }
    addSectionTitle('CLÁUSULAS CONTRATUAIS')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(120, 120, 120)
    const placeholderMsg = 'As cláusulas contratuais serão inseridas conforme o modelo jurídico definido pela ANXIS. Este documento contém os dados técnicos e comerciais do projeto para formalização do contrato.'
    y = addText(placeholderMsg, margin, y, contentWidth, 9, 'italic')
    doc.setTextColor(12, 29, 54)
    y += 20

    // ── SIGNATURE LINES ──
    if (y > 240) { doc.addPage(); y = 25 }
    y += 10
    doc.setDrawColor(12, 29, 54)
    doc.line(margin, y, margin + 70, y)
    doc.line(pageWidth - margin - 70, y, pageWidth - margin, y)
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('CONTRATANTE', margin, y)
    doc.text('CONTRATADA (ANXIS)', pageWidth - margin - 70, y)
    y += 4
    doc.text(clientSnapshot.client_name || 'Cliente', margin, y)
    doc.text('ANXIS Tecnologia', pageWidth - margin - 70, y)

    // ── FOOTER ──
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `ANXIS Tecnologia — Contrato ${contractId} — Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfOutput)

    // Generate file name and storage path
    const timestamp = Date.now()
    const sanitizedTitle = (projectSnapshot.title || 'contrato')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
    const fileName = `contrato-${sanitizedTitle}-${timestamp}.pdf`
    const storagePath = `contracts/${projectId}/${contractId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await adminSupabase.storage
      .from('contracts')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
    }

    // Update contract record with file info
    await adminSupabase.from('contracts').update({
      status: 'completed',
      storage_path: storagePath,
      file_name: fileName,
      file_size: pdfBuffer.length,
      generated_at: new Date().toISOString(),
      error_message: null,
    }).eq('id', contractId)

    // Update job record
    await adminSupabase.from('contract_generation_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      last_error: null,
    }).eq('contract_id', contractId)

    console.log(`Contract PDF generated successfully: ${storagePath} (${pdfBuffer.length} bytes)`)

  } catch (err: any) {
    console.error('Contract PDF generation failed:', err)

    // Update contract and job with error
    await adminSupabase.from('contracts').update({
      status: 'failed',
      error_message: err?.message || 'Erro desconhecido na geração do PDF.',
    }).eq('id', contractId)

    await adminSupabase.from('contract_generation_jobs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      last_error: err?.message || 'Erro desconhecido.',
    }).eq('contract_id', contractId)
  }
}

// ──────────────────────────────────────────────
// 6. DOWNLOAD CONTRACT (signed URL)
// ──────────────────────────────────────────────
export async function downloadContractAction(contractId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  // Fetch contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    return { success: false, message: 'Contrato não encontrado.' }
  }

  if (contract.status !== 'completed' || !contract.storage_path) {
    return { success: false, message: 'O contrato ainda não foi gerado ou falhou na geração.' }
  }

  // Generate signed URL using admin client (bypasses storage RLS)
  const adminSupabase = createAdminClient()
  const { data: signedData, error: signError } = await adminSupabase.storage
    .from('contracts')
    .createSignedUrl(contract.storage_path, 3600) // 1 hour expiry

  if (signError || !signedData) {
    return { success: false, message: signError?.message || 'Erro ao gerar URL de download.' }
  }

  return {
    success: true,
    signedUrl: signedData.signedUrl,
    fileName: contract.file_name,
  }
}

// ──────────────────────────────────────────────
// 7. RETRY CONTRACT GENERATION
// ──────────────────────────────────────────────
export async function retryContractGeneration(contractId: string) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (!contract) return { success: false, message: 'Contrato não encontrado.' }
  if (contract.status !== 'failed') return { success: false, message: 'O contrato não está em estado de falha.' }

  // Reset status
  await supabase.from('contracts').update({ status: 'pending', error_message: null }).eq('id', contractId)

  // Create new job
  await supabase.from('contract_generation_jobs').insert({
    contract_id: contractId,
    project_id: contract.project_id,
    status: 'pending',
    attempts: 0,
  })

  // Re-trigger generation
  generateContractPdf(
    contractId,
    contract.project_id,
    contract.client_data_snapshot,
    contract.project_data_snapshot,
    contract.pricing_snapshot,
    contract.final_value
  ).catch(err => console.error('Contract retry generation error:', err))

  revalidatePath('/admin')
  return { success: true }
}
