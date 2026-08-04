# ANXIS - Landing Page & Painel Administrativo

Aplicação web moderna, institucional e de alta conversão para a empresa **ANXIS**, especializada em desenvolvimento de sites institucionais, lojas virtuais (Tray, Nuvemshop, WooCommerce) e projetos personalizados em código (Next.js, React).

---

## 🛠️ Tecnologias Utilizadas

- **Next.js** (App Router, Server Components & Server Actions)
- **TypeScript** & **Tailwind CSS**
- **Motion for React** (Animações fluidas e respeitosas a `prefers-reduced-motion`)
- **Supabase** (PostgreSQL, Auth RLS & Storage Buckets)
- **React Hook Form** & **Zod** (Validação estrita do formulário)
- **Lucide React** (Ícones vetoriais)
- **Centralized Analytics** (GTM, Meta Pixel, Google Ads, GA4) & Captura Silenciosa de UTMs

---

## 🚀 Como Executar o Projeto Locamene

### 1. Clonar / Navegar até a pasta do projeto
```bash
cd /Users/dicce/Documents/anxis_LP
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
Preencha as credenciais do seu projeto Supabase.

### 4. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:3000`  
Painel Administrativo: `http://localhost:3000/admin`

---

## 🗄️ Configuração do Banco de Dados Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Acesse a aba **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo de migração: `supabase/migrations/20260804000000_initial_schema.sql`.
4. Execute o script no Supabase para criar as tabelas, índices e políticas de segurança **Row Level Security (RLS)**.

### Criando o Primeiro Administrador

Para criar o primeiro usuário administrador com acesso ao `/admin`:
1. Acesse **Authentication > Users** no Supabase e clique em **Add User**.
2. Insira o e-mail e senha de sua escolha.
3. Obtenha o `ID` (UUID) do usuário recém-criado.
4. Execute o comando SQL no Supabase:
```sql
INSERT INTO public.admin_profiles (user_id, name, role)
VALUES ('SEU_USER_UUID_AQUI', 'Administrador ANXIS', 'admin');
```

---

## 🌐 Publicação na Vercel

1. Importe o repositório na [Vercel](https://vercel.com).
2. Adicione as Variáveis de Ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
3. Clique em **Deploy**.

---

## 📊 Checklist de Validação

- [x] Logotipo ANXIS preservado sem distorção (SVG Light e Dark)
- [x] Animação de auto-scroll (`translateY`) nas screenshots de projetos ao passar o mouse ou tocar no mobile
- [x] Filtros dinâmicos por categoria de projetos
- [x] Carrossel contínuo (Marquee em 2 linhas) de tecnologias e marcas
- [x] Formulário de solicitação de proposta com Zod + Honeypot + Rastreamento silencioso de UTMs
- [x] Painel Administrativo em `/admin` protegido por Supabase Auth
- [x] CRUD completo de cases de portfólio (criar, editar, destacar, ocultar e reordenar)
- [x] Injetor dinâmico de tags de analytics (GTM ID e Meta Pixel)
- [x] SEO técnico com Schema.org JSON-LD, Sitemap.xml e Robots.txt
- [x] Botão flutuante do WhatsApp surgindo após a rolagem da Hero
