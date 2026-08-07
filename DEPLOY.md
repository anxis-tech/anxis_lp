# Guia de Deploy — ANXIS LP (Hostinger)

Este documento descreve o processo correto de deploy para evitar o erro:

> `Error: Failed to find Server Action "...". This request might be from an older or newer deployment.`

---

## Causa do Erro

O Next.js gera uma **chave AES aleatória a cada `next build`** para criptografar as referências de Server Action. Em ambientes self-hosted, se o servidor recebe uma chamada de Server Action gerada por um build anterior (por exemplo, porque o usuário tem o painel aberto e o deploy foi feito sem reiniciar o Node ou sem limpar cache), o servidor da nova versão não consegue localizar a action e lança este erro.

**Fatores que causam o problema:**
1. Chave AES rotativa a cada build (sem `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`)
2. HTML da página `/admin` em cache — o browser serve HTML antigo com IDs antigos de Server Action
3. Processo Node reiniciado com `.next` misturado (arquivos de versões diferentes)
4. Deploy sem encerrar o processo Node antigo antes do novo

---

## Pré-requisito: Chave de Criptografia Estável

### Gerar uma vez (faça isso agora, nunca repita para o mesmo ambiente)

```bash
openssl rand -base64 32
```

### Configurar no painel da Hostinger

1. Acesse: **Painel da Hostinger → Site → Node.js → Environment Variables**
2. Adicione a variável:
   - **Nome:** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
   - **Valor:** (o resultado do `openssl` acima)
3. **Salve e não altere este valor em deploys futuros** — mudar a chave tem o mesmo efeito de não tê-la

> ⚠️ NUNCA commite o valor real desta chave no repositório.

---

## Processo de Deploy Correto

```bash
# 1. No servidor Hostinger, entre no diretório do projeto
cd /home/user/seu-projeto

# 2. Atualize o repositório
git pull origin main

# 3. Instale dependências (se houver mudanças no package.json)
npm ci --production=false

# 4. ENCERRE o processo Node atual ANTES de buildar
pm2 stop anxis-lp   # ou o nome do seu processo pm2

# 5. Remova o .next anterior COMPLETAMENTE
rm -rf .next

# 6. Execute o build limpo
# (NEXT_SERVER_ACTIONS_ENCRYPTION_KEY deve estar no ambiente da Hostinger)
npm run build

# 7. Inicie o novo processo Node com a nova build
pm2 restart anxis-lp --update-env

# 8. Confirme qual build está servindo
cat .next/BUILD_ID
```

---

## Verificações Pós-Deploy

Após cada deploy, verifique:

- [ ] `cat .next/BUILD_ID` → retorna o hash do commit atual
- [ ] Abra o painel `/admin` em aba anônima → login deve funcionar
- [ ] Crie ou edite um projeto → Server Action deve salvar sem erros
- [ ] Confira os logs: `pm2 logs anxis-lp | grep "Failed to find Server Action"` → não deve aparecer

---

## O que NÃO fazer

| ❌ Errado | ✅ Correto |
|---|---|
| Reiniciar Node com `.next` antigo ainda lá | Remover `.next` antes do build |
| Manter 2 processos Node ativos simultaneamente | Encerrar o antigo antes de iniciar o novo |
| Não configurar `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Configurar no painel antes do `npm run build` |
| Trocar a chave a cada deploy | Reutilizar a mesma chave estável |
| Commitar o valor da chave no `.env` | Configurar apenas no painel da Hostinger |

---

## Referências

- [Next.js Deploying — Server Actions](https://nextjs.org/docs/app/getting-started/deploying#server-actions)
- [Next.js serverActionsEncryptionKey](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActionsEncryptionKey)
