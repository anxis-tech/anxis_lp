# Prospecção

O módulo é parte do Next.js existente. A rota `/prospecting` concentra campanha, indicadores, progresso real, filtros, tabela paginada, seleção em massa e detalhe em drawer. O menu Comercial do administrativo inclui o acesso à Prospecção.

## Instalação

1. Instale as dependências com `npm ci`.
2. No banco Supabase já utilizado pelo projeto, aplique **somente estas migrations novas**, na ordem abaixo. As migrations antigas do repositório incluem scripts históricos de reconstrução e não devem ser reaplicadas em produção.
   - `supabase/migrations/20260911000000_prospecting.sql`: 16 tabelas, índices, RLS, view da tabela, RPCs de interface e worker.
   - `supabase/migrations/20260911010000_prospecting_rules.sql`: regras determinísticas iniciais.
   - `supabase/migrations/20260911020000_prospecting_cron.sql`: função de instalação do Cron, sem ativá-lo automaticamente.
3. As migrations dependem da estrutura existente `profiles(user_id,is_active,is_super_admin,custom_permissions)` e de Supabase Auth. São incrementais e transacionais. O banco precisa suportar `UNIQUE NULLS NOT DISTINCT` e views `security_invoker` (PostgreSQL 15+).
4. Se usar Supabase CLI, confira o histórico remoto com `supabase migration list` e o plano com `supabase db push --dry-run` antes de aplicar. Como a pasta antiga era ignorada pelo Git, não suponha que o histórico remoto corresponda aos arquivos locais. Alternativamente execute os três arquivos novos pelo SQL Editor, em ordem.
5. Em Usuários e Permissões, habilite **Visualizar Prospecção** (`prospecting.view`) e, para operadores, **Gerenciar Prospecção** (`prospecting.manage`). Administradores reais (`is_super_admin=true`) ativos possuem acesso. Cargo e endereço de e-mail não concedem autorização ao módulo.
6. Configure e publique a Edge Function conforme abaixo.
7. Acesse `/prospecting`, crie uma campanha e acompanhe os jobs. A ação de criação persiste campanha e job inicial na mesma transação, sem chamar o Google na requisição da interface.

Nenhuma migration foi aplicada a um banco remoto e nenhuma API paga foi acionada durante a implementação. O processo de instalação não envia contatos.

## Variáveis de ambiente

| Variável | Onde configurar | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js, já existente | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js, já existente | Cliente autenticado com RLS |
| `SUPABASE_URL` | Edge Function, fornecida pelo Supabase | Banco do worker |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function, fornecida pelo Supabase | RPCs privadas do worker; nunca no browser |
| `GOOGLE_PLACES_API_KEY` | Secrets da Edge Function | Descoberta e detalhes de estabelecimentos |
| `GOOGLE_PAGESPEED_API_KEY` | Secrets da Edge Function | Auditoria PageSpeed mobile |
| `GEMINI_API_KEY` | Secrets da Edge Function | Análise comercial estruturada |
| `GEMINI_MODEL` | Secrets da Edge Function | ID do modelo Gemini com Structured Output disponível no projeto |
| `PROSPECTING_WORKER_SECRET` | Secrets da Edge Function e Supabase Vault | Token aleatório exclusivo para o Cron |

As chaves privadas não usam `NEXT_PUBLIC_`. O Next.js não precisa receber chaves Google ou Gemini. Use `docs/prospecting.env.example` como referência para um arquivo local de secrets **fora do controle de versão**.

## Google Places

No Google Cloud, habilite **Places API (New)** e o faturamento do projeto. Crie uma chave restrita a essa API e configure cotas e alertas adequados ao volume desejado. Configure `GOOGLE_PLACES_API_KEY` no worker.

A descoberta usa Text Search (New), com máscara `places.id,nextPageToken`. O enriquecimento solicita apenas nome, status, categoria, website, telefone, rating, número de avaliações, endereço, coordenadas e atribuições. O nome do estabelecimento não é solicitado na etapa de descoberta. `google_place_id` é único e cada associação campanha/lead também é única. Dados de enriquecimento recentes podem ser reaproveitados por até 24 horas; Atualizar dados força uma nova consulta.

Os segmentos possuem termos de pesquisa explícitos em `campaign.schema.ts`. Cada termo pagina até o limite documentado de três páginas. O Google limita atualmente uma Text Search a até 60 resultados; selecionar 1.000 não garante 1.000 empresas. Os segmentos iniciais têm dois ou três termos e Outros tem um. Ao esgotar os termos, a campanha informa que encontrou menos empresas que o volume solicitado. Ampliar cobertura por bairros/coordenadas é uma extensão futura, não uma simulação de volume. [Documentação de Text Search e Field Masks](https://developers.google.com/maps/documentation/places/web-service/text-search).

A interface identifica a origem Google Maps e mantém atribuições retornadas. O uso e a retenção dos dados em produção devem seguir as [políticas do Places](https://developers.google.com/maps/documentation/places/web-service/policies). A configuração de retenção/expurgo do ambiente não foi automatizada neste MVP.

## PageSpeed e auditoria HTTP

Habilite a **PageSpeed Insights API**, crie uma chave e configure `GOOGLE_PAGESPEED_API_KEY`. A integração solicita as categorias performance, SEO, accessibility e best-practices, sempre na estratégia mobile. [Guia oficial do PageSpeed](https://developers.google.com/speed/docs/insights/v5/get-started).

Sem essa chave, o crawler continua e as métricas são exibidas como desconhecidas, sem penalizar ou pontuar a ausência de informação. Falhas de uma API configurada provocam retries e aparecem com contexto na interface. Leads sem site ou com endereço exclusivamente social seguem direto para scoring.

A auditoria lê apenas o HTML da página inicial e `robots.txt`, sem executar JavaScript, seguir páginas internas, preencher formulários ou enviar mensagens. Usa parser HTML (`linkedom`), respeita bloqueios de robots e não atribui pontos. Há validação de URL, DNS público, IP fixado na conexão, validação de TLS, bloqueio de endereços privados, limite de três redirects, 1 MB por resposta e prazo total de 20 segundos para o crawler. O PageSpeed tem timeout de 45 segundos.

Recursos não encontrados em páginas com conteúdo insuficiente permanecem desconhecidos. Em HTML suficiente, a ausência é uma detecção limitada à página inicial, e essa limitação aparece no detalhe. Sinais de múltiplas unidades, franquia, processos manuais e integração não são inventados: o motor suporta esses dados estruturados, mas o MVP não os infere de palavras vagas.

## Gemini

Crie a chave no projeto Google AI correspondente e defina `GEMINI_API_KEY` e `GEMINI_MODEL` com um modelo disponível que suporte Structured Output. O modelo é configurável para evitar dependência de um ID que pode ser descontinuado.

O motor decide o score antes da IA. Um job de IA só é criado quando `score >= ai_score_threshold`, o lead não é eliminado e possui pelo menos 40 pontos. O default do threshold é 85; o operador pode ajustá-lo na campanha. O worker confere novamente o score do histórico antes da chamada.

O payload contém apenas dados estruturados de negócio, presença digital, blocos de score e sinais, sem HTML, telefone ou e-mail. A resposta usa JSON Schema derivado de Zod e é validada antes de persistir. A IA não atualiza `current_score` nem itens de scoring. [Structured Output do Gemini](https://ai.google.dev/gemini-api/docs/structured-output).

Quando a chave ou o modelo não estão configurados, o lead e o score continuam disponíveis; o job de IA informa a pendência e pode ser repetido após a configuração. O histórico anterior da IA é identificado no drawer quando o score já foi recalculado.

## Edge Function e Cron

O worker fica em `supabase/functions/prospecting-worker`. O `deno.json` fixa as versões de dependências, e o `deno.lock` registra as resoluções. Os serviços e o motor de score são compartilhados com `modules/prospecting`; não existe um backend paralelo.

Com Supabase CLI autenticado e vinculado ao projeto correto:

```sh
supabase secrets set --env-file /caminho/privado/prospecting-worker.env
supabase functions deploy prospecting-worker
```

`supabase/config.toml` configura `verify_jwt=false` porque o endpoint usa um token próprio exclusivo para Cron. Isso não torna o worker público: ele exige `Authorization: Bearer <PROSPECTING_WORKER_SECRET>`, compara o token em tempo constante, aceita apenas POST e retorna 401 para tokens ausentes ou incorretos. Não utilize a chave de serviço como token do Cron.

No painel do Supabase, habilite **Cron/pg_cron**, **pg_net** e **Vault**. No Vault, crie:

- `prospecting_project_url`: URL `https://<project-ref>.supabase.co`, sem barra final.
- `prospecting_worker_secret`: exatamente o mesmo token aleatório configurado na Edge Function.

Depois, no SQL Editor com acesso administrativo:

```sql
select public.prospecting_install_cron();
```

A função cria/atualiza o agendamento `prospecting-worker`, executado a cada minuto. Ela recusa instalação sem extensões/secrets. As credenciais são lidas do Vault na execução, sem ficar no comando do Cron. [Agendamento de Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).

Verificação operacional:

```sql
select jobname, schedule, active from cron.job where jobname = 'prospecting-worker';
select status, count(*) from public.prospecting_jobs group by status;
select type, attempts, max_attempts, error_message, run_after
from public.prospecting_jobs where status in ('pending', 'failed')
order by created_at desc limit 20;
```

Para interromper chamadas periódicas:

```sql
select cron.unschedule('prospecting-worker');
```

Cada execução reivindica até cinco jobs. O claim usa `FOR UPDATE SKIP LOCKED`, altera o status atomicamente e registra worker/lease. Locks transacionais por campanha coordenam alterações manuais e finalizações; o claim usa aquisição não bloqueante para não paralisar outras campanhas. As etapas independentes do lote são executadas em paralelo. O lease expira em dez minutos; resultados de workers antigos não são aceitos. As tentativas usam backoff de um e cinco minutos, até três tentativas.

A RPC `prospecting_complete_job` persiste resultados, histórico, sinais e jobs filhos na mesma transação. Chaves únicas e dedupe impedem duplicações persistidas. Isso não garante cobrança externa exatamente uma vez: se uma execução cair após receber a resposta do provedor e antes do commit, uma nova tentativa pode repetir a chamada externa.

Pausar impede novos claims. Jobs já reivindicados podem concluir. Descartar um lead cancela jobs pendentes/em execução e invalida o lease. Recalcular/atualizar não duplica um processamento já pendente; novas execuções mantêm o histórico anterior.

## Arquitetura e permissões

```text
Server Action autenticada + Zod + permissão
  → campanha e primeiro job em transação
  → Cron → Edge Function → claim atômico
      → discover_places → enrich_lead
          → sem site/social: calculate_score
          → website: audit_website → calculate_score
              → threshold atingido: analyze_ai
  → consultas autenticadas com RLS → filtros/ordenação/paginação no PostgreSQL
```

Os clientes Supabase já existentes são reaproveitados. Os dados deste módulo pertencem a um espaço comercial interno compartilhado pelos usuários autorizados; não há conceito novo de tenant ou propriedade exclusiva por vendedor. Usuários sem `prospecting.view` não conseguem ler tabelas/view. Escritas diretas por authenticated/anon são revogadas. As Server Actions exigem as permissões e chamam apenas RPCs curtas. As RPCs de processamento são privadas para `service_role`.

`prospecting_leads` representa a empresa global; `prospecting_campaign_leads` mantém a associação, snapshots usados na campanha, score atual e status comercial. Qualificação automática e `pipeline_stage` são independentes. A troca comercial cria evento apenas se a etapa mudou e registra último contato quando marcada como contatada.

O score é `business + max(site, system) + commercial - penalidades`, limitado a 0–100. Os blocos têm limites de 30/50/50/20. O histórico guarda entrada, regras carregadas, versão e resultado; os itens explicam cada regra. O JSON de regras no código serve de fixture para testes, e a fonte operacional é `prospecting_scoring_rules`. Overrides usam o mesmo `code` e `campaign_id`; uma regra de campanha pode alterar pontos, condição e habilitação. Não há editor visual de regras nesta fase.

A listagem traz 25 leads por página com filtros e ordenação no banco. A seleção em massa se aplica explicitamente à página visível. As campanhas mais recentes são limitadas a 100 no seletor; detalhes mostram até 20 históricos de score/eventos e 10 auditorias. O polling da página ocorre a cada seis segundos depois da resposta anterior, sem estimativa artificial de tempo restante.

## Funcionalidades implementadas

- Campanha compacta com segmento, cidade/UF, volume, score mínimo e threshold de IA.
- Indicadores da campanha, progresso por etapas e contexto de falhas/retries.
- Busca Places, dedupe, enriquecimento, sinais, auditoria HTTP e PageSpeed.
- Scoring determinístico, classificações, histórico auditável e overrides globais/por campanha.
- Gemini estruturado após qualificação, separado do score.
- Filtros avançados e rápidos, ordenação no banco e paginação.
- Drawer com dados, breakdown, regras aplicadas, detecções, métricas, IA e histórico comercial.
- Alteração individual/em massa de estágio, descarte/restauração, atualização, recálculo e repetição de etapa com falha.
- Autenticação, permissões individuais, RLS e worker com acesso protegido.

## Contatos preparados, sem ativação

Botões individuais e em massa de WhatsApp/e-mail informam que a integração não está configurada e não enviam mensagens. As tabelas `prospecting_contacts`, `prospecting_outreach_campaigns`, `prospecting_outreach_recipients` e `prospecting_messages` reservam contatos, consentimento, templates, destinatários e estados de envio. Dados de telefone vindos do Google são registrados como telefone, sem presumir que possuem WhatsApp. O e-mail observado no site pode ser registrado como contato com consentimento desconhecido.

Campanhas de outreach só aceitam estado `draft` nesta fase. Não existem endpoints de disparo, webhooks de mensagem, scraping de redes sociais, geração automática de proposta ou integração com CRM externo.

## Validação e limitações

Comandos locais:

```sh
npm run test:prospecting
npx tsc --noEmit --incremental false
npx eslint modules/prospecting app/prospecting supabase/functions/prospecting-worker
npx deno check --config supabase/functions/prospecting-worker/deno.json supabase/functions/prospecting-worker/index.ts
npm run build
```

Os 19 testes passaram. Eles usam Node Test Runner/tsx e PostgreSQL embarcado (PGlite), sem chamar Google ou Gemini. Cobrem regras, caps, penalidades, classificação, threshold, overrides, parser, bloqueios SSRF, contratos dos serviços, RLS, claims, idempotência, retries, pausa e cancelamento. O teste de interface em navegador, com Server Actions substituídas por dados simulados em um harness temporário, passou em desktop (1440 px) e celular (390 px): estado inicial, campanha, seleção em massa, status, placeholder de contato, drawer com Escape e filtros rápidos, sem erros JavaScript ou overflow horizontal da página. O navegador não foi adicionado como dependência da aplicação.

Um smoke test HTTP adicional foi executado em Deno contra `https://example.com`, com resposta 200 e parser funcional.

O lint geral do projeto já apresenta 111 erros e 127 avisos. A mesma contagem foi reproduzida em uma cópia limpa do HEAD anterior. O módulo novo é verificado separadamente, sem ampliar esses problemas.

`npm audit` também reportou quatro vulnerabilidades em dependências já existentes: Next.js (crítica), js-yaml, nanoid e sharp (altas). As versões desses pacotes são idênticas às do HEAD anterior; não houve atualização do framework ou dessas dependências neste módulo. A correção desses alertas requer uma atualização separada com validação das funcionalidades existentes.

Pendências de ambiente: aplicar migrations remotas, configurar chaves/cotas/modelo, publicar a função, cadastrar secrets no Vault e ativar Cron. Google Places, PageSpeed e Gemini não foram testados com credenciais reais. O fluxo autenticado em navegador com dados do Supabase real depende dessa instalação. O build comprova a compilação da rota, não a configuração das integrações remotas.

## Arquivos da entrega

Arquivos criados:

- `app/prospecting/page.tsx`
- `docs/prospecting.env.example`
- `docs/prospecting.md`
- `modules/prospecting/actions/auth.ts`
- `modules/prospecting/actions/index.ts`
- `modules/prospecting/components/campaign-form.tsx`
- `modules/prospecting/components/contact-actions.tsx`
- `modules/prospecting/components/lead-drawer.tsx`
- `modules/prospecting/components/lead-filters.tsx`
- `modules/prospecting/components/prospecting-workspace.tsx`
- `modules/prospecting/components/shared.tsx`
- `modules/prospecting/repositories/audit.repository.ts`
- `modules/prospecting/repositories/base.ts`
- `modules/prospecting/repositories/campaign.repository.ts`
- `modules/prospecting/repositories/database.test.ts`
- `modules/prospecting/repositories/job.repository.ts`
- `modules/prospecting/repositories/lead.repository.ts`
- `modules/prospecting/repositories/score.repository.ts`
- `modules/prospecting/schemas/ai-analysis.schema.ts`
- `modules/prospecting/schemas/campaign.schema.ts`
- `modules/prospecting/schemas/lead.schema.ts`
- `modules/prospecting/scoring/classification.ts`
- `modules/prospecting/scoring/default-rules.json`
- `modules/prospecting/scoring/engine.test.ts`
- `modules/prospecting/scoring/engine.ts`
- `modules/prospecting/scoring/evaluator.ts`
- `modules/prospecting/scoring/types.ts`
- `modules/prospecting/services/gemini.service.ts`
- `modules/prospecting/services/google-places.service.ts`
- `modules/prospecting/services/http.ts`
- `modules/prospecting/services/pagespeed.service.ts`
- `modules/prospecting/services/safe-http.ts`
- `modules/prospecting/services/services.test.ts`
- `modules/prospecting/services/website-audit.service.ts`
- `modules/prospecting/types/index.ts`
- `supabase/config.toml`
- `supabase/functions/prospecting-worker/context.ts`
- `supabase/functions/prospecting-worker/deno.json`
- `supabase/functions/prospecting-worker/deno.lock`
- `supabase/functions/prospecting-worker/handlers/analyze-ai.ts`
- `supabase/functions/prospecting-worker/handlers/audit-website.ts`
- `supabase/functions/prospecting-worker/handlers/calculate-score.ts`
- `supabase/functions/prospecting-worker/handlers/discover-places.ts`
- `supabase/functions/prospecting-worker/handlers/enrich-lead.ts`
- `supabase/functions/prospecting-worker/index.ts`
- `supabase/migrations/20260911000000_prospecting.sql`
- `supabase/migrations/20260911010000_prospecting_rules.sql`
- `supabase/migrations/20260911020000_prospecting_cron.sql`

Arquivos existentes alterados:

- `.gitignore`: inclui somente as três migrations novas no versionamento.
- `app/admin/page.tsx`: acesso à Prospecção no menu Comercial.
- `components/admin/tabs/users-permissions-tab.tsx`: permissões individuais de leitura e gestão.
- `lib/auth/permissions.ts`: constantes de permissão.
- `package.json`: comando de testes e dependências isoladas.
- `package-lock.json`: resoluções das dependências.
- `tsconfig.json`: imports TypeScript explícitos compartilhados e separação da checagem Deno.

Dependências novas: `linkedom` (parser HTML), `robots-parser` (robots.txt) e `ipaddr.js` (classificação de IPs). Dependências apenas de desenvolvimento: `tsx` (testes TypeScript) e `@electric-sql/pglite` (testes PostgreSQL isolados).
