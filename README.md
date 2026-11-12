# FoodConnect (app do cliente)

App Expo / React Native em que o cliente escolhe o restaurante, monta o carrinho, paga pelo Asaas e acompanha o pedido.

## Configurar Supabase

1. Crie um projeto em [Supabase](https://supabase.com) e copie a URL e a chave anon/public.
2. Crie o arquivo `.env` na raiz a partir de `.env.example`:

```powershell
Copy-Item .env.example .env
```

Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Essas são as únicas variáveis permitidas no app; nunca coloque `SERVICE_ROLE_KEY` ou chave do Asaas no Expo.

3. Banco: no **SQL Editor**, rode `01_limpar_banco.sql` e depois
   `supabase/migrations/20261007000000_esquema_foodconnect.sql` (de uma vez só). Esse arquivo cria tabelas,
   regras de acesso (RLS), triggers, tempo real e o bucket `imagens`.

   Ou, pelo CLI (o banco precisa estar limpo):

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O `SEU_PROJECT_REF` está na URL do projeto, entre `https://` e `.supabase.co`.

## Cadastro do cliente

`RegisterScreen` envia `tipo_cadastro='cliente'`, `nome`, `cpf` e `telefone` em `options.data`; o trigger
`criar_conta_no_cadastro()` cria a linha em `public.clientes`. O CPF (opcional no cadastro) é exigido na hora de pagar.

## Pagamento (Asaas)

O carrinho chama a Edge Function `create-payment`, que cria o pedido (`aguardando_pagamento`), calcula os preços no
servidor e devolve o `invoice_url` do Asaas. Quando o Asaas confirma o pagamento, a função `asaas-webhook` marca o
pedido como pago e ele aparece no painel do restaurante.

Configuração completa (secrets, deploy, webhook, testes): veja o README do painel (`FoodConnect/README.md`, seções 3 a 6).
Resumo:

```powershell
npx supabase secrets set ASAAS_API_KEY='$aact_...' ASAAS_ENV=sandbox ASAAS_WEBHOOK_TOKEN=um-token-longo NOTIFICAR_WEBHOOK_SECRET=outro-segredo
npx supabase functions deploy create-payment
npx supabase functions deploy asaas-subconta
npx supabase functions deploy asaas-webhook --no-verify-jwt
npx supabase functions deploy notificar-pedido --no-verify-jwt


## Executar

powershell
npm install
npx expo start

# Integração Asaas + Supabase (Edge Functions)

Passo a passo para configurar a integração de pagamentos em um novo computador.
Todos os comandos rodam no terminal (PowerShell/VS Code), dentro da pasta do projeto.

> Nunca coloque chaves ou tokens neste arquivo nem no Git. Use os placeholders abaixo
> e preencha com os valores reais apenas no terminal.

## Pré-requisitos

- Node.js instalado (o `npx` vem junto)
- Conta no Asaas (sandbox para testes: https://sandbox.asaas.com)
- Acesso ao projeto no Supabase

Neste projeto os comandos usam `npx supabase ...`, então não é preciso instalar a CLI.

## 1. Entrar na pasta do projeto

```powershell
cd "CAMINHO\DA\PASTA\DO\PROJETO"
```

Use aspas se o caminho tiver espaços ou acentos.

## 2. Login e vínculo com o projeto

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

O `SEU_PROJECT_REF` é só o identificador (a parte antes de `.supabase.co`), não a URL inteira.
Está em Project Settings → General → Reference ID.

## 3. Configurar os secrets

```powershell
npx supabase secrets set ASAAS_API_KEY='SUA_CHAVE_DO_ASAAS'
npx supabase secrets set ASAAS_URL=https://api-sandbox.asaas.com/v3
npx supabase secrets set ASAAS_WEBHOOK_TOKEN=SEU_TOKEN_DO_WEBHOOK
```

- A chave do Asaas começa com `$`, por isso fica entre **aspas simples** no PowerShell.
- `ASAAS_URL` em produção: `https://api.asaas.com/v3`.
- `ASAAS_WEBHOOK_TOKEN` é uma senha que você inventa. O mesmo valor deve ser cadastrado no Asaas.

Para gerar um token aleatório de 40 caracteres:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})
```

Conferir os nomes dos secrets (os valores não são exibidos):

```powershell
npx supabase secrets list
```

## 4. Deploy das funções

```powershell
npx supabase functions deploy criar-cobranca --use-api
npx supabase functions deploy asaas-webhook --no-verify-jwt --use-api
```

- `--no-verify-jwt` no webhook é necessário porque o Asaas não envia token do Supabase.
- `--use-api` evita a necessidade do Docker.

Conferir se estão ativas:

```powershell
npx supabase functions list
```

## 5. Banco de dados (SQL Editor do Supabase)

```sql
alter table pedidos
  add column if not exists asaas_payment_id text unique,
  add column if not exists payment_status text default 'pendente',
  add column if not exists payment_method text,
  add column if not exists paid_at timestamptz;

-- Status do pedido (retirada no local)
alter table pedidos
  add constraint pedidos_status_check
  check (status in ('aguardando_pagamento','pendente','preparo','pronto','retirado','cancelado'));

-- Atualização em tempo real no painel
alter publication supabase_realtime add table pedidos;
```

Se já existir uma restrição antiga na coluna `status`, remova-a antes:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.pedidos'::regclass and contype = 'c';

alter table pedidos drop constraint if exists NOME_DA_RESTRICAO_ANTIGA;
```

## 6. Cadastrar o webhook no Asaas

No painel do Asaas: **Integrações → Webhooks → criar novo**.

- **URL:** `https://SEU_PROJECT_REF.supabase.co/functions/v1/asaas-webhook`
- **Token de autenticação:** o mesmo valor de `ASAAS_WEBHOOK_TOKEN` (sem espaços no começo/fim)
- **Eventos:** `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`
- Webhook **ativo** e e-mail de aviso preenchido

Se o Asaas pausar a fila por falhas, reative manualmente no painel.

## 7. Fluxo de status do pedido

| status | Significado | Quem muda |
|---|---|---|
| `aguardando_pagamento` | Pedido criado, aguardando pagamento | `criar-cobranca` |
| `pendente` | Pago, novo pedido para o restaurante | Webhook |
| `preparo` | Em preparo | Painel |
| `pronto` | Pronto para retirada | Painel |
| `retirado` | Cliente retirou, pedido concluído | Painel |
| `cancelado` | Cancelado | Webhook ou painel |

## 8. Testar

1. Faça um pedido no app e pague (PIX) no sandbox do Asaas.
2. Simule/confirme o pagamento da cobrança no painel do Asaas.
3. Verifique em **Supabase → Table Editor → pedidos**: `status = pendente`, `payment_status = aprovado`, `paid_at` preenchido.
4. Em caso de erro, veja **Edge Functions → asaas-webhook → Logs**.

| Sintoma nos logs | Causa provável |
|---|---|
| Nenhum registro | Webhook não cadastrado, inativo ou com URL errada |
| 401 | Token do Asaas diferente de `ASAAS_WEBHOOK_TOKEN` |
| "pedido não encontrado" | Falta `asaas_payment_id` no pedido ou `externalReference` na cobrança |
| "valor divergente" | Valor pago diferente de `valor_total` |

## 9. Ir para produção

1. Gerar a chave de API na conta de produção do Asaas.
2. Atualizar os secrets:
   ```powershell
   npx supabase secrets set ASAAS_API_KEY='SUA_CHAVE_DE_PRODUCAO'
   npx supabase secrets set ASAAS_URL=https://api.asaas.com/v3
   ```
3. Cadastrar o webhook novamente na conta de produção.

# App: cartões salvos + "salvar cartão para próximas compras"

Antes do app, o backend precisa estar no ar (pasta `cartoes/`): SQL `03_cartoes_salvos.sql` rodado
e as funções `salvar-cartao` e `create-payment` com deploy feito.

## Arquivos (copie para a raiz do projeto `FoodConnect_RT`, mantendo as pastas)

| Arquivo | O que é |
|---|---|
| `src/lib/cartaoUtils.js` | **Novo.** Máscaras e validações (cartão, CPF, validade, CEP, telefone) |
| `src/lib/cartoes.js` | **Novo.** Chamadas: listar, salvar, remover cartão, buscar CPF |
| `src/components/CartaoForm.js` | **Novo.** Campos do formulário de cartão (usado nas duas telas) |
| `src/screens/CardsScreen.js` | **Novo.** Tela "Meus cartões" (lista, adicionar, remover) |
| `src/screens/CartScreen.js` | **Substitui a atual.** Forma de pagamento + "Salvar cartão para próximas compras" |
| `src/screens/ProfileScreen.js` | **Substitui a atual.** Só ganhou a linha "Meus cartões" |
| `App.js` | **Substitui o atual.** Só ganhou 2 imports e 2 rotas: `Cartoes` e `Pedidos` |

Não há dependência nova: nada para instalar.

## Como funciona

**Meus cartões** (Perfil → Meus cartões): lista "Visa •••• 4242", botão Remover e "Adicionar cartão".

**Na hora de pagar** (Carrinho → Forma de pagamento):
- cada cartão salvo aparece como opção; o mais recente já vem marcado;
- **Pagar com novo cartão**: abre o formulário e a chave **"Salvar cartão para próximas compras"**
  - ligada: o cartão fica salvo depois do pagamento;
  - desligada: o cartão é usado e removido logo em seguida;
  - se o cartão for **recusado**, ele não fica salvo em nenhum dos casos;
- **Pix ou outros meios**: igual ao que existia (abre a página do Asaas).

Resultados: 402 mostra "Pagamento recusado" com o motivo; 202 mostra "em processamento";
sucesso leva para **Meus pedidos**, que atualiza sozinho quando o webhook confirma.

## O que encontrei no código do app e corrigi (precisa do seu OK)

1. **O carrinho chamava o contrato antigo (Mercado Pago).** Enviava `restauranteId` / `items` /
   `produtoId` e esperava `initPoint`, mas a função do Asaas recebe `empresa_id` / `itens` /
   `produto_id` e devolve `invoice_url`. Com o código antigo, o pagamento falharia com "Pedido
   inválido". Corrigido no `CartScreen.js`.
2. **Faltava o CPF.** O cadastro do app só pede nome, e `create-payment` exige CPF. Agora o carrinho
   (e a tela de cartões) pede o CPF **uma vez**, só se o cliente ainda não tiver; o servidor guarda.
3. **A rota `Pedidos` não existia em `App.js`**, mas o carrinho navegava para ela. Registrada.

## O que NÃO mexi, mas você precisa conferir

- **`src/data/restaurantes.js` lê colunas que não estão no esquema novo** (`02_esquema`):
  `empresas.categoria`, `empresas.nota`, `empresas.tempo_preparo_min` e `produtos.ordem`.
  Se o seu banco é esse esquema, a Home e o cardápio dão erro de "column does not exist".
  Se isso já funciona para você, o banco tem essas colunas a mais e pode ignorar este item.
- **A pasta `supabase/functions` do projeto tem a `create-payment` antiga e a `mp-webhook`**
  (Mercado Pago). Não faça deploy a partir dela: use os arquivos da pasta `cartoes/`.
  Vale substituir a `create-payment` dessa pasta pela nova para o projeto não divergir do que está no ar.

## Testar (Expo)

1. `npx expo start` e abra no celular (Expo Go) ou emulador.
2. Perfil → Meus cartões → Adicionar cartão. Deve aparecer "Cartão salvo" e a bandeira com o final.
3. Carrinho: o cartão salvo vem marcado. Finalizar → "Pagamento enviado" → tela Meus pedidos.
   O pedido vira "Pagamento aprovado — aguardando o restaurante" assim que o Asaas confirmar.
4. Carrinho → "Pagar com novo cartão" com a chave desligada: depois do pagamento, o cartão **não**
   aparece em Meus cartões.
5. Recusa: use o Mastercard `5184019740373151` ou o Visa `4916561358240741` (sandbox). Deve mostrar
   "Pagamento recusado" e o cartão não fica salvo.

## Segurança

- Número e CVV existem só nos campos da tela e na chamada para `salvar-cartao`; são apagados depois
  do uso. Não há `console.log` nem armazenamento deles.
- O token do cartão nunca chega ao app (a coluna é bloqueada no banco). Por isso a lista usa
  `select("id, ultimos_digitos, bandeira")`; `select("*")` daria "permission denied".
- Remover um cartão apaga o registro no seu banco; o token continua existindo no Asaas, mas só
  funciona com a sua chave de API e para aquele cliente.
  
## Erros comuns

- **`supabase` não é reconhecido:** use `npx supabase ...`.
- **`failed to read file ... index.ts`:** você não está na pasta do projeto, ou o arquivo não está em `supabase/functions/NOME_DA_FUNCAO/index.ts`.
- **Variável "não foi definida" ao salvar a chave:** faltaram as aspas simples em volta da chave.
- **Arquivos do OneDrive não aparecem:** marque a pasta como "Manter sempre neste dispositivo".
