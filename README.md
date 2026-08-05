# ANXIS - Landing Page & Painel Administrativo Operational V5

Aplicação web institucional e de alta conversão para a empresa **ANXIS**, acompanhada por um Painel Administrativo com Quadro Kanban Integrado, Calculadora Comercial, Gestão de Orçamentos, Gestão de Projetos de Clientes e Controle de Acesso Granular (RBAC) 100% integrados ao **Supabase em Produção**.

---

## 🛠️ Módulos do Painel Administrativo (`/admin`)

O painel é estruturado em 5 módulos operacionais estratégicos:

1. **Visão Geral (Dashboard)**: Métricas em tempo real conectadas ao banco de dados (Receita Total Recebida, Projetos Fechados & Pagos, Pagamentos Pendentes, Projetos em Andamento) e tabela de projetos recentes com filtros por status e responsável.
2. **Portfólio da Home**: Controle de cases exibidos no carrossel/grade da landing page pública via Server Actions e Supabase Storage (`portfolio-public`).
3. **Projetos de Clientes & Kanban**: Gestão interna em lista e formulário de 7 abas (Informações Gerais, Contato, Escopo & Briefing, Links & Arquivos Privados via bucket `client-project-files` com assinaturas digitais, Responsáveis, Planejamento e Observações).
   - Estágios do Kanban: *Novo projeto*, *Em desenvolvimento*, *Aguardando revisão*, *Concluído*.
   - Movimentação de cards sincronizada em tempo real com auditoria e timeline.
4. **Orçamentos & Calculadora**: Precificação comercial baseada em regras dinamizadas no Supabase (`pricing_settings`), snapshots imutáveis em `quotes` e conversão direta de orçamento para Projeto de Cliente.
5. **Usuários e Permissões**: Módulo de gestão de equipe para administradores configurarem cargos (*Administrador*, *Comercial*, *Designer*) e matriz de permissões granulares por abas e ações.

---

## 🔒 Segurança, RLS e Autenticação

- **Supabase Auth**: Sessões validadas no servidor via `@supabase/ssr` / Middleware. Usuários inativos têm o acesso bloqueado imediatamente.
- **Row Level Security (RLS)**: Habilitado em **todas** as tabelas administrativas (`profiles`, `client_projects`, `quotes`, `pricing_settings`, `audit_logs`, `notifications`, etc.).
- **Storage Buckets**:
  - `portfolio-public`: Leitura pública, escrita restrita a membros autenticados.
  - `client-project-files`: Armazenamento privado com URLs assinadas expiráveis (`createSignedUrl`).
  - `avatars`: Leitura pública para fotos de perfil.
  - `quote-documents`: Documentos privados de orçamentos.

---

## 🚀 Como Executar a Migração no Supabase

1. Acesse o painel da sua hospedagem / **Supabase Console** > **SQL Editor**.
2. Cole e execute o arquivo de migração idempotente e não-destrutivo:
   `supabase/migrations/20260805000000_full_supabase_production.sql`

---

## ⚡ Verificação de Build de Produção
```bash
npx next build --webpack
```
