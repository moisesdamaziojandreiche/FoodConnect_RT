// Salva um cartão do cliente: tokeniza no Asaas e guarda SÓ o token, os 4 últimos
// dígitos e a bandeira. Número completo e CVV nunca são gravados nem registrados em log.
//
// Corpo esperado (é o que o app envia em src/lib/cartoes.js):
//   { cpfCnpj?, cartao: { numero, nome, mes, ano, cvv },
//     titular: { cep, numero_endereco, complemento?, telefone } }
// Resposta: { cartao: { id, ultimos_digitos, bandeira } }
//
// Tabelas usadas (ver migrations/20261124000000_cartoes_salvos.sql):
//   clientes (já existia), clientes_asaas, cartoes_salvos
//
// Deploy normal (com verificação de JWT, igual à create-payment):
//   npx supabase functions deploy salvar-cartao
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ASAAS_KEY = Deno.env.get("ASAAS_API_KEY")!;
const ASAAS_URL =
  Deno.env.get("ASAAS_ENV") === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const MAX_CARTOES_POR_CLIENTE = 10;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Erro do Asaas SEM o corpo da requisição (que contém o cartão) e sem os textos
// devolvidos: guardamos só o status e os códigos, que é o que pode ir para o log.
class AsaasError extends Error {
  status: number;
  codes: string[];
  descricoes: string[];
  constructor(status: number, errors: unknown) {
    super(`Asaas ${status}`);
    this.status = status;
    const lista = Array.isArray(errors) ? errors : [];
    this.codes = lista.map((e) => String(e?.code ?? "")).filter(Boolean);
    this.descricoes = lista.map((e) => String(e?.description ?? "")).filter(Boolean);
  }
}

async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ASAAS_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(60_000),
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_KEY,
      "User-Agent": "FoodConnect",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AsaasError(res.status, data?.errors);
  return data;
}

const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// Mesma regra de public.cpf_valido() do banco (clientes.cpf tem CHECK)
function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[n])) return false;
  }
  return true;
}

function luhnValido(numero: string) {
  let soma = 0;
  let dobra = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (dobra) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
    dobra = !dobra;
  }
  return soma % 10 === 0;
}

// Só usada se o Asaas não devolver a bandeira. Cobre as mais comuns; o resto fica sem bandeira.
function bandeiraPeloNumero(n: string): string | null {
  if (/^4/.test(n)) return "VISA";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  return null;
}

// O Asaas exige o IP do APARELHO do cliente (não o do servidor).
// cf-connecting-ip é definido pela borda e não pode ser forjado pelo app.
function ipDoCliente(req: Request): string | null {
  const bruto =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0];
  const ip = (bruto ?? "").trim();
  return ip && ip.length <= 45 && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // 1) Autenticação do cliente (JWT do Supabase Auth)
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Não autenticado" }, 401);
  const user = userData.user;
  if (!user.email) return json({ error: "Conta sem e-mail" }, 400);

  // 2) Validação da entrada (o servidor valida tudo de novo, o app é só conveniência)
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const numero = soDigitos(body?.cartao?.numero);
  const nome = String(body?.cartao?.nome ?? "").trim();
  const mes = soDigitos(body?.cartao?.mes).padStart(2, "0");
  const ano = soDigitos(body?.cartao?.ano);
  const cvv = soDigitos(body?.cartao?.cvv);
  const cep = soDigitos(body?.titular?.cep);
  const numeroEndereco = String(body?.titular?.numero_endereco ?? "").trim();
  const complemento = String(body?.titular?.complemento ?? "").trim();
  const telefone = soDigitos(body?.titular?.telefone);

  if (numero.length < 13 || numero.length > 19 || !luhnValido(numero)) {
    return json({ error: "Número do cartão inválido." }, 400);
  }
  if (nome.length < 2 || nome.length > 60) {
    return json({ error: "Informe o nome impresso no cartão." }, 400);
  }
  if (!/^(0[1-9]|1[0-2])$/.test(mes) || !/^\d{4}$/.test(ano)) {
    return json({ error: "Validade inválida." }, 400);
  }
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000); // horário de Brasília
  if (
    Number(ano) < agora.getUTCFullYear() ||
    (Number(ano) === agora.getUTCFullYear() && Number(mes) < agora.getUTCMonth() + 1)
  ) {
    return json({ error: "Cartão vencido." }, 400);
  }
  if (!/^\d{3,4}$/.test(cvv)) return json({ error: "CVV inválido." }, 400);
  if (cep.length !== 8) return json({ error: "CEP inválido." }, 400);
  if (!numeroEndereco || numeroEndereco.length > 10) {
    return json({ error: "Número do endereço inválido." }, 400);
  }
  if (telefone.length < 10 || telefone.length > 11) {
    return json({ error: "Telefone inválido. Informe com DDD." }, 400);
  }

  const remoteIp = ipDoCliente(req);
  if (!remoteIp) return json({ error: "Não foi possível identificar o dispositivo." }, 400);

  // 3) Cliente (nome e CPF): usa o cadastro; se faltar CPF, usa o que veio na requisição.
  const { data: cliente } = await admin
    .from("clientes")
    .select("nome, cpf")
    .eq("id", user.id)
    .maybeSingle();

  const nomeCliente = String(cliente?.nome ?? user.user_metadata?.nome ?? nome).trim();
  const cpf = soDigitos(cliente?.cpf ?? body?.cpfCnpj);
  if (!cpfValido(cpf)) return json({ error: "CPF inválido ou não informado." }, 400);

  // Garante a linha em "clientes" (cartoes_salvos referencia clientes.id) e guarda o CPF.
  if (!cliente) {
    const { error } = await admin.from("clientes").upsert(
      { id: user.id, nome: nomeCliente, cpf },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) {
      console.error("salvar-cartao: erro ao gravar cliente:", error.code);
      return json({ error: "Não foi possível salvar o cartão." }, 500);
    }
  } else if (!cliente.cpf) {
    await admin.from("clientes").update({ cpf }).eq("id", user.id);
  }

  // Limite de cartões por cliente
  const { count } = await admin
    .from("cartoes_salvos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", user.id);
  if ((count ?? 0) >= MAX_CARTOES_POR_CLIENTE) {
    return json({ error: `Limite de ${MAX_CARTOES_POR_CLIENTE} cartões salvos.` }, 400);
  }

  try {
    // 4) Cliente no Asaas: cria uma vez e reaproveita (o token só vale para ele)
    let { data: vinculo } = await admin
      .from("clientes_asaas")
      .select("asaas_customer_id")
      .eq("cliente_id", user.id)
      .maybeSingle();

    if (!vinculo) {
      const customer = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: nomeCliente,
          cpfCnpj: cpf,
          email: user.email,
          externalReference: user.id,
          notificationDisabled: true,
        }),
      });

      // Se duas requisições chegarem juntas, a primeira a gravar vence.
      await admin
        .from("clientes_asaas")
        .upsert(
          { cliente_id: user.id, asaas_customer_id: customer.id },
          { onConflict: "cliente_id", ignoreDuplicates: true },
        );
      ({ data: vinculo } = await admin
        .from("clientes_asaas")
        .select("asaas_customer_id")
        .eq("cliente_id", user.id)
        .maybeSingle());
      if (!vinculo) throw new Error("vínculo do cliente Asaas não gravado");
    }

    // 5) Tokenização (não gera cobrança)
    const holderInfo: Record<string, string> = {
      name: nome,
      email: user.email,
      cpfCnpj: cpf,
      postalCode: cep,
      addressNumber: numeroEndereco,
    };
    if (complemento) holderInfo.addressComplement = complemento;
    if (telefone.length === 11) holderInfo.mobilePhone = telefone;
    else holderInfo.phone = telefone;

    const resp = await asaas("/creditCard/tokenizeCreditCard", {
      method: "POST",
      body: JSON.stringify({
        customer: vinculo.asaas_customer_id,
        creditCard: {
          holderName: nome,
          number: numero,
          expiryMonth: mes,
          expiryYear: ano,
          ccv: cvv,
        },
        creditCardHolderInfo: holderInfo,
        remoteIp,
      }),
    });

    const tokenCartao = String(resp?.creditCardToken ?? "");
    if (!tokenCartao) throw new Error("Asaas não devolveu creditCardToken");

    // Só os 4 últimos dígitos (calculados aqui, do que o cliente digitou) e a bandeira.
    const ultimos = numero.slice(-4);
    const bandeira =
      String(resp?.creditCardBrand ?? "").toUpperCase() || bandeiraPeloNumero(numero);

    // 6) Grava só token + 4 últimos dígitos + bandeira
    const { data: salvo, error: insErr } = await admin
      .from("cartoes_salvos")
      .upsert(
        {
          cliente_id: user.id,
          asaas_credit_card_token: tokenCartao,
          ultimos_digitos: ultimos,
          bandeira,
        },
        { onConflict: "cliente_id,asaas_credit_card_token" },
      )
      .select("id, ultimos_digitos, bandeira")
      .single();
    if (insErr || !salvo) throw new Error(`erro ao gravar cartão (${insErr?.code ?? "?"})`);

    return json({ cartao: salvo });
  } catch (e) {
    // Nunca registra corpo da requisição nem texto devolvido pelo Asaas: só status e códigos.
    if (e instanceof AsaasError) {
      console.error("salvar-cartao: Asaas", e.status, e.codes.join(","));
      if (e.status === 400 && e.codes.some((c) => c.startsWith("invalid_creditCard"))) {
        return json(
          { error: "Cartão não autorizado. Verifique os dados e tente novamente." },
          422,
        );
      }
      if (e.status === 400 && e.descricoes.length > 0) {
        return json({ error: `Dados recusados: ${e.descricoes[0]}` }, 400);
      }
    } else {
      console.error("salvar-cartao:", e instanceof Error ? e.message : "erro");
    }
    return json({ error: "Não foi possível salvar o cartão." }, 502);
  }
});