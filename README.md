# ANXIS - Landing Page & Painel Administrativo Operational V4

Aplicação web institucional e de alta conversão para a empresa **ANXIS**, acompanhada por um Painel Administrativo com Quadro Kanban Integrado, Calculadora Comercial, Gestão de Projetos e Controle de Acesso Granular (RBAC).

---

## 🛠️ Módulos do Painel Administrativo (`/admin`)

O painel é estruturado em 5 módulos operacionais estratégicos:

1. **Portfólio da Home**: Controle exclusivo dos cases exibidos no carrossel/grade da landing page pública.
2. **Projetos de Clientes**: Gestão interna em lista e formulário completo em 7 abas (Geral, Contato do Cliente, Escopo & Briefing, Links & Arquivos Privados, Responsáveis, Planejamento e Observações).
3. **Kanban de Projetos**: Visualização em colunas por 4 estágios essenciais (*Novo projeto*, *Em desenvolvimento*, *Aguardando revisão*, *Concluído*).
   - Suporte a Drag & Drop e Select acessível para dispositivos móveis.
   - Rolagem horizontal restrita internamente à área do Kanban.
   - Visibilidade restrita ao profissional atribuído via RLS.
4. **Calculadora de Precificação**: Ferramenta comercial para cálculo de estimativas financeiras com subtotal, impostos, descontos, exportação, histórico e engrenagem ⚙️ de configurações de taxas.
5. **Usuários e Permissões**: Módulo de gestão de equipe para criar novos usuários via convite por e-mail ou senha temporária, cargos (*Administrador*, *Comercial*, *Designer*) e permissões granulares por módulo.

---

## 🚀 Como Executar as Migrações no Supabase

1. Acesse o **[Supabase](https://supabase.com)** > no projeto clique em **SQL Editor**.
2. Execute a migração inicial: `supabase/migrations/20260804000000_initial_schema.sql`.
3. Execute a migração V2: `supabase/migrations/20260804010000_admin_v2_schema.sql`.
4. Execute a migração V3 (Kanban): `supabase/migrations/20260804020000_kanban_schema.sql`.
5. Execute a migração V4 (Limpeza de tabelas desnecessárias): `supabase/migrations/20260804030000_cleanup_unused_tables.sql`.

---

## ⚡ Verificação de Build Locais
```bash
npm run dev
npx next build
```
