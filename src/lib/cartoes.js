// Acesso aos cartões salvos (tokenização Asaas).
// O app NUNCA guarda número nem CVV: eles seguem direto para a função salvar-cartao,
// que devolve só o id, os 4 últimos dígitos e a bandeira.
import { supabase } from "./supabase";
import { montarCorpoCartao, soDigitos } from "./cartaoUtils";

const NAO_CONFIGURADO = "Supabase não configurado";

// Quando uma função responde 4xx/5xx, o texto útil está no corpo da resposta.
export async function mensagemDeErro(error) {
  try {
    const corpo = await error.context.json();
    if (corpo?.error) return corpo.error;
  } catch (e) {
    // corpo ilegível: usa a mensagem genérica
  }
  return error.message;
}

// Lista só colunas liberadas (o token do cartão fica bloqueado no banco: nunca use select("*")).
export async function listarCartoes() {
  if (!supabase.from) return { data: [], error: { message: NAO_CONFIGURADO } };

  return supabase
    .from("cartoes_salvos")
    .select("id, ultimos_digitos, bandeira")
    .order("created_at", { ascending: false });
}

// CPF já cadastrado do cliente, ou null se ainda não tiver (aí o app precisa pedir).
export async function buscarCpfCliente() {
  if (!supabase.from) return null;

  const { data: auth } = await supabase.auth.getUser();
  const usuario = auth?.user;
  if (!usuario) return null;

  const { data } = await supabase
    .from("clientes")
    .select("cpf")
    .eq("id", usuario.id)
    .maybeSingle();

  return data?.cpf || null;
}

// Tokeniza o cartão no Asaas (via função) e guarda só o token no servidor.
// Devolve { cartao } em caso de sucesso ou { erro } com a mensagem para mostrar.
export async function salvarCartao(form, cpfCnpj = null) {
  const body = {
    ...(cpfCnpj ? { cpfCnpj: soDigitos(cpfCnpj) } : {}),
    ...montarCorpoCartao(form),
  };

  const { data, error } = await supabase.functions.invoke("salvar-cartao", { body });

  if (error) return { cartao: null, erro: await mensagemDeErro(error) };
  if (!data?.cartao) return { cartao: null, erro: "Não foi possível salvar o cartão." };
  return { cartao: data.cartao, erro: null };
}

export async function removerCartao(id) {
  if (!supabase.from) return { error: { message: NAO_CONFIGURADO } };
  return supabase.from("cartoes_salvos").delete().eq("id", id);
}