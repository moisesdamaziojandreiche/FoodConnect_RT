// Funções puras (sem dependências) do formulário de cartão: máscaras e validações.
// Nada aqui guarda nem registra dados do cartão.

export const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

export const FORM_VAZIO = {
  numero: "",
  nome: "",
  validade: "",
  cvv: "",
  cep: "",
  numeroEndereco: "",
  complemento: "",
  telefone: "",
};

// ---------- Máscaras ----------

export function mascararNumeroCartao(v) {
  return soDigitos(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function mascararValidade(v) {
  const d = soDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function mascararCep(v) {
  const d = soDigitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascararTelefone(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascararCpf(v) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ---------- Validações ----------

// Algoritmo de Luhn: pega erro de digitação antes de chamar o servidor.
export function luhnValido(numero) {
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

// Mesma regra usada no servidor e no banco (public.cpf_valido)
export function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(cpf[n])) return false;
  }
  return true;
}

// Devolve a mensagem do primeiro erro, ou null se o formulário está ok.
// (O servidor valida tudo de novo; aqui é só para o cliente corrigir rápido.)
export function validarCartao(f, hoje = new Date()) {
  const numero = soDigitos(f.numero);
  if (numero.length < 13 || numero.length > 19 || !luhnValido(numero)) {
    return "Número do cartão inválido.";
  }

  if (String(f.nome ?? "").trim().length < 2) {
    return "Informe o nome impresso no cartão.";
  }

  const m = /^(\d{2})\/(\d{2})$/.exec(f.validade ?? "");
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
    return "Validade inválida. Use MM/AA.";
  }
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (ano < hoje.getFullYear() || (ano === hoje.getFullYear() && mes < hoje.getMonth() + 1)) {
    return "Cartão vencido.";
  }

  if (!/^\d{3,4}$/.test(soDigitos(f.cvv))) return "CVV inválido.";

  if (soDigitos(f.cep).length !== 8) return "CEP inválido.";

  const numeroEndereco = String(f.numeroEndereco ?? "").trim();
  if (!numeroEndereco || numeroEndereco.length > 10) {
    return "Informe o número do endereço (até 10 caracteres).";
  }

  const telefone = soDigitos(f.telefone);
  if (telefone.length < 10 || telefone.length > 11) {
    return "Telefone inválido. Informe com DDD.";
  }

  return null;
}

// Corpo esperado pela função salvar-cartao (sem o cpfCnpj, que o chamador acrescenta).
export function montarCorpoCartao(f) {
  const [mes, aa] = String(f.validade).split("/");
  return {
    cartao: {
      numero: soDigitos(f.numero),
      nome: String(f.nome).trim(),
      mes,
      ano: `20${aa}`,
      cvv: soDigitos(f.cvv),
    },
    titular: {
      cep: soDigitos(f.cep),
      numero_endereco: String(f.numeroEndereco).trim(),
      complemento: String(f.complemento ?? "").trim(),
      telefone: soDigitos(f.telefone),
    },
  };
}

// ---------- Exibição ----------

const BANDEIRAS = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMEX: "American Express",
  DINERS: "Diners",
  DISCOVER: "Discover",
  HIPERCARD: "Hipercard",
  CABAL: "Cabal",
  JCB: "JCB",
};

export function nomeBandeira(bandeira) {
  return BANDEIRAS[String(bandeira ?? "").toUpperCase()] ?? "Cartão";
}