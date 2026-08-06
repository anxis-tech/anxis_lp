# ANXIS - Landing Page & Painel Administrativo Operational V5

Aplicação web institucional e de alta conversão para a empresa **ANXIS**, acompanhada por um Painel Administrativo com Quadro Kanban Integrado, Calculadora Comercial, Gestão de Orçamentos, Gestão de Projetos de Clientes e Controle de Acesso Granular (RBAC) 100% integrados ao **Supabase em Produção**.

---

## 🛠️ Módulos do Painel Administrativo (`/admin`)

O painel é estruturado em 5 módulos operacionais estratégicos:

1. **Visão Geral (Dashboard)**: Métricas em tempo real conectadas ao banco de dados (Receita Total Confirmada via InfinitePay, Projetos Fechados & Pagos, Pagamentos Pendentes, Projetos em Andamento) e tabela de projetos recentes com filtros por status e responsável.
2. **Portfólio da Home**: Controle de cases exibidos no carrossel/grade da landing page pública via Server Actions e Supabase Storage (`portfolio-public`).
3. **Projetos de Clientes & Kanban**: Gestão interna em lista e formulário de 7 abas (Informações Gerais, Contato do Cliente, Escopo & Briefing, Links & Arquivos Privados, Contrato em PDF e Cobrança InfinitePay com link oficial).
   - Estágios do Kanban: *Novo projeto*, *Em desenvolvimento*, *Aguardando revisão*, *Concluído*.
   - Movimentação de cards sincronizada em tempo real com auditoria e timeline.
4. **Orçamentos & Calculadora**: Precificação comercial baseada em regras dinamizadas no Supabase (`pricing_settings`), snapshots imutáveis em `quotes` e conversão direta de orçamento para Projeto de Cliente.
5. **Checkout Integrado InfinitePay & Webhook**:
   - Geração automática e sob demanda de links oficiais de pagamento InfinitePay (`https://api.checkout.infinitepay.io/links`) vinculados ao contrato concluído em PDF.
   - Endpoint público de Webhook (`/api/webhooks/infinitepay`) com auditoria (`payment_webhook_events`) e confirmação server-to-server idêntica à API oficial (`/payment_check`).
   - Rota de retorno pública (`/pagamento/retorno`) para o cliente.
6. **Usuários e Permissões**: Módulo de gestão de equipe para administradores configurarem cargos (*Administrador*, *Comercial*, *Designer*) e matriz de permissões granulares por abas e ações (`payments.view`, `payments.create`, `payments.copy_link`, etc.).

---

## 🔒 Segurança, RLS e Autenticação

- **Supabase Auth**: Sessões validadas no servidor via `@supabase/ssr` / Middleware. Usuários inativos têm o acesso bloqueado imediatamente.
- **Row Level Security (RLS)**: Habilitado em **todas** as tabelas administrativas (`profiles`, `client_projects`, `quotes`, `contracts`, `payments`, `payment_webhook_events`, `pricing_settings`, `audit_logs`).
- **Storage Buckets**:
  - `portfolio-public`: Leitura pública, escrita restrita a membros autenticados.
  - `client-project-files`: Armazenamento privado com URLs assinadas expiráveis (`createSignedUrl`).
  - `contracts`: PDFs de contratos gerados no servidor.

---

## ⚙️ Variáveis de Ambiente (`.env`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=https://anxis.tech
INFINITEPAY_HANDLE=sua_tag_aqui
```

---

## 🚀 Como Executar as Migrações no Supabase

1. Acesse o **Supabase Console** > **SQL Editor**.
2. Cole e execute as migrações idempotentes e não-destrutivas:
   - `supabase/migrations/20260806000000_contracts_schema.sql`
   - `supabase/migrations/20260807000000_infinitepay_payments_schema.sql`

---

## ⚡ Verificação de Build de Produção
```bash
npx tsc --noEmit
npm run build
```
