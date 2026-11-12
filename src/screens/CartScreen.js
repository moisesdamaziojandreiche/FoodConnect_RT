import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { carrinho } from "../data/carrinho";
import { supabase } from "../lib/supabase";
import Menu from "../components/Menu";
import CartaoForm from "../components/CartaoForm";
import { ThemeContext } from "../context/ThemeContext";
import { Botao, Campo, Cartao, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { espaco, fonte, raio } from "../theme/tema";
import {
  FORM_VAZIO,
  cpfValido,
  mascararCpf,
  nomeBandeira,
  soDigitos,
  validarCartao,
} from "../lib/cartaoUtils";
import {
  buscarCpfCliente,
  listarCartoes,
  mensagemDeErro,
  removerCartao,
  salvarCartao,
} from "../lib/cartoes";

// Uma linha de escolha da forma de pagamento (cartão salvo, novo cartão ou página do Asaas)
function Opcao({ selecionado, titulo, subtitulo, icone, onPress, cores }) {
  const borda = selecionado ? cores.principal : cores.borda;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.opcao,
        {
          backgroundColor: selecionado ? cores.principalSuave : cores.card,
          borderColor: borda,
        },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.opcaoIcone, { backgroundColor: selecionado ? cores.principal : cores.borda }]}>
        <Ionicons
          name={icone}
          size={19}
          color={selecionado ? "#FFFFFF" : cores.secundario}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: cores.texto, fontWeight: "700", fontSize: fonte.corpo }}>{titulo}</Text>
        {!!subtitulo && (
          <Text style={{ color: cores.secundario, marginTop: 2, fontSize: fonte.pequena }}>
            {subtitulo}
          </Text>
        )}
      </View>

      <View style={[styles.radio, { borderColor: borda }]}>
        {selecionado && (
          <View style={[styles.radioMiolo, { backgroundColor: cores.principal }]} />
        )}
      </View>
    </Pressable>
  );
}

export default function CartScreen({ navigation }) {
  const { cores } = useContext(ThemeContext);
  const respiro = useRespiroMenu();

  const [, atualizarTela] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Forma de pagamento: id de um cartão salvo | "novo" | "outros" (página do Asaas: Pix etc.)
  const [cartoes, setCartoes] = useState([]);
  const [escolha, setEscolha] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvarParaDepois, setSalvarParaDepois] = useState(true);

  // undefined = carregando | null = cliente ainda sem CPF cadastrado
  const [cpfCliente, setCpfCliente] = useState(undefined);
  const [cpf, setCpf] = useState("");
  const precisaCpf = cpfCliente === null;

  const subtotal = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );
  const total = subtotal;

  const carregarPagamento = useCallback(async () => {
    const [{ data }, cpfSalvo] = await Promise.all([
      listarCartoes(),
      buscarCpfCliente(),
    ]);
    const lista = data || [];

    setCartoes(lista);
    setCpfCliente(cpfSalvo);
    // Mantém a escolha do cliente; senão, o cartão salvo mais recente ou a página do Asaas.
    setEscolha((atual) => {
      if (atual === "novo" || atual === "outros") return atual;
      if (atual && lista.some((c) => c.id === atual)) return atual;
      return lista[0]?.id ?? "outros";
    });
  }, []);

  // Recarrega ao voltar de "Meus cartões" (cartão novo, removido etc.)
  useEffect(() => {
    carregarPagamento();
    return navigation.addListener("focus", carregarPagamento);
  }, [navigation, carregarPagamento]);

  function alterarQuantidade(item, delta) {
    item.quantidade += delta;

    if (item.quantidade <= 0) {
      carrinho.splice(carrinho.indexOf(item), 1);
    }

    atualizarTela((n) => n + 1);
  }

  function limparCarrinho() {
    carrinho.length = 0;
    setObservacao("");
    setForm(FORM_VAZIO); // os dados do cartão não ficam na memória do app
    atualizarTela((n) => n + 1);
  }

  async function finalizarPedido() {
    if (carrinho.length === 0) {
      Alert.alert("Carrinho vazio", "Nenhum pedido encontrado.");
      return;
    }

    if (precisaCpf && !cpfValido(soDigitos(cpf))) {
      Alert.alert("CPF inválido", "Informe um CPF válido para o pagamento.");
      return;
    }

    if (escolha === "novo") {
      const erroForm = validarCartao(form);
      if (erroForm) {
        Alert.alert("Confira o cartão", erroForm);
        return;
      }
    }

    setEnviando(true);

    let cartaoId = cartoes.some((c) => c.id === escolha) ? escolha : null;
    // Cartão novo que o cliente não quis salvar: é removido assim que o pagamento é enviado.
    let removerDepois = null;

    try {
      if (escolha === "novo") {
        const { cartao, erro } = await salvarCartao(form, precisaCpf ? cpf : null);
        if (!cartao) {
          Alert.alert("Não foi possível usar o cartão", erro);
          return;
        }
        cartaoId = cartao.id;
        if (!salvarParaDepois) removerDepois = cartao.id;
      }

      // Só ids e quantidades: o servidor consulta os preços no banco.
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          empresa_id: carrinho[0].restauranteId,
          itens: carrinho.map((item) => ({
            produto_id: item.id,
            quantidade: item.quantidade,
          })),
          observacao: observacao.trim(),
          ...(precisaCpf ? { cpfCnpj: soDigitos(cpf) } : {}),
          ...(cartaoId ? { cartao_id: cartaoId } : {}),
        },
      });

      if (error) {
        const recusado = error.context?.status === 402;
        // Cartão recusado não deve ficar salvo.
        if (recusado && escolha === "novo") removerDepois = cartaoId;

        Alert.alert(
          recusado ? "Pagamento recusado" : "Pagamento indisponível",
          await mensagemDeErro(error)
        );
        return;
      }

      // Cobrança no cartão demorou: o pedido existe e o webhook confirma o pagamento.
      if (data?.processando) {
        limparCarrinho();
        Alert.alert(
          "Pagamento em processamento",
          "Ainda estamos confirmando o pagamento. Acompanhe o pedido na próxima tela."
        );
        navigation.navigate("Pedidos");
        return;
      }

      // Cobrança no cartão enviada: o pedido é liberado quando o Asaas confirmar (webhook).
      if (cartaoId) {
        limparCarrinho();
        Alert.alert(
          "Pagamento enviado",
          "Estamos confirmando o pagamento. Acompanhe o pedido na próxima tela."
        );
        navigation.navigate("Pedidos");
        return;
      }

      // Sem cartão: o cliente paga (Pix etc.) na página do Asaas.
      if (!data?.invoice_url) {
        Alert.alert("Pagamento indisponível", "Tente novamente.");
        return;
      }

      limparCarrinho();
      await WebBrowser.openBrowserAsync(data.invoice_url);

      // Depois do pagamento, mostra o status do pedido (atualiza em tempo real).
      navigation.navigate("Pedidos");
    } finally {
      if (removerDepois) {
        await removerCartao(removerDepois).catch(() => {});
      }
      setEnviando(false);
    }
  }

  const bloqueado =
    carrinho.length === 0 || enviando || cpfCliente === undefined || !escolha;

  return (
    <Tela cores={cores} topo>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.conteudo, { paddingBottom: respiro + 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.titulo, { color: cores.texto }]}>
            Meu Carrinho
          </Text>

          {carrinho.length > 0 && (
            <View style={styles.restaurante}>
              <Ionicons name="storefront-outline" size={16} color={cores.secundario} />
              <Text style={{ color: cores.secundario, fontSize: fonte.corpo }}>
                {carrinho[0].restauranteNome}
              </Text>
            </View>
          )}

          {carrinho.length === 0 && (
            <EstadoVazio
              cores={cores}
              icone="cart-outline"
              titulo="Seu carrinho está vazio."
              texto="Escolha um restaurante e adicione seus pratos favoritos."
            />
          )}

          {carrinho.length > 0 && (
            <Cartao cores={cores} estilo={styles.listaItens}>
              {carrinho.map((item, indice) => (
                <View
                  key={item.chaveProduto}
                  style={[
                    styles.item,
                    indice > 0 && { borderTopWidth: 1, borderTopColor: cores.borda },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nomeProduto, { color: cores.texto }]}>
                      {item.nome}
                    </Text>

                    <Text style={[styles.preco, { color: cores.principal }]}>
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.quantidade, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
                    <Pressable
                      style={styles.botaoQtd}
                      onPress={() => alterarQuantidade(item, -1)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={item.quantidade === 1 ? "trash-outline" : "remove"}
                        size={18}
                        color={item.quantidade === 1 ? cores.erro : cores.principal}
                      />
                    </Pressable>

                    <Text style={[styles.qtdTexto, { color: cores.texto }]}>
                      {item.quantidade}
                    </Text>

                    <Pressable
                      style={styles.botaoQtd}
                      onPress={() => alterarQuantidade(item, 1)}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={18} color={cores.principal} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </Cartao>
          )}

          {carrinho.length > 0 && (
            <>
              <View style={styles.retirada}>
                <Ionicons name="bag-handle-outline" size={17} color={cores.secundario} />
                <Text style={{ color: cores.secundario, flex: 1, fontSize: fonte.corpo - 1 }}>
                  Retirada no restaurante
                  {carrinho[0].restauranteEndereco
                    ? `: ${carrinho[0].restauranteEndereco}`
                    : ""}
                </Text>
              </View>

              <Campo
                cores={cores}
                icone="create-outline"
                placeholder="Observação (opcional)"
                value={observacao}
                onChangeText={setObservacao}
                maxLength={300}
              />

              <Text style={[styles.secao, { color: cores.texto }]}>
                Forma de pagamento
              </Text>

              {cartoes.map((cartao) => (
                <Opcao
                  key={cartao.id}
                  cores={cores}
                  icone="card"
                  selecionado={escolha === cartao.id}
                  titulo={`${nomeBandeira(cartao.bandeira)} •••• ${cartao.ultimos_digitos}`}
                  subtitulo="Cartão de crédito salvo"
                  onPress={() => setEscolha(cartao.id)}
                />
              ))}

              <Opcao
                cores={cores}
                icone="add-circle-outline"
                selecionado={escolha === "novo"}
                titulo="Pagar com novo cartão"
                subtitulo="Cartão de crédito"
                onPress={() => setEscolha("novo")}
              />

              {escolha === "novo" && (
                <View style={styles.novoCartao}>
                  <CartaoForm valores={form} setValores={setForm} cores={cores} />

                  <View style={styles.linhaSwitch}>
                    <Text
                      style={{ color: cores.texto, flex: 1, marginRight: 10 }}
                    >
                      Salvar cartão para próximas compras
                    </Text>
                    <Switch
                      value={salvarParaDepois}
                      onValueChange={setSalvarParaDepois}
                      trackColor={{ true: cores.principal }}
                    />
                  </View>
                </View>
              )}

              <Opcao
                cores={cores}
                icone="qr-code-outline"
                selecionado={escolha === "outros"}
                titulo="Pix ou outros meios"
                subtitulo="Você escolhe na página de pagamento"
                onPress={() => setEscolha("outros")}
              />

              {precisaCpf && (
                <Campo
                  cores={cores}
                  icone="id-card-outline"
                  containerStyle={{ marginTop: espaco.md }}
                  placeholder="Seu CPF (necessário para o pagamento)"
                  keyboardType="number-pad"
                  maxLength={14}
                  value={cpf}
                  onChangeText={(t) => setCpf(mascararCpf(t))}
                />
              )}
            </>
          )}

          {carrinho.length > 0 && (
            <View style={[styles.resumo, { borderTopColor: cores.borda }]}>
              <Text style={[styles.resumoRotulo, { color: cores.secundario }]}>
                Total
              </Text>
              <Text style={[styles.total, { color: cores.texto }]}>
                R$ {total.toFixed(2)}
              </Text>
            </View>
          )}

          <Botao
            cores={cores}
            titulo={enviando ? "Enviando..." : "Finalizar Pedido"}
            icone={enviando ? undefined : "checkmark-circle-outline"}
            onPress={finalizarPedido}
            desabilitado={bloqueado}
            carregando={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Menu navigation={navigation} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.sm,
  },

  titulo: {
    fontSize: fonte.tela,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  restaurante: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: espaco.lg,
  },

  secao: {
    fontSize: fonte.titulo - 2,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: espaco.xl,
    marginBottom: espaco.xs,
  },

  listaItens: {
    paddingVertical: 4,
    paddingHorizontal: espaco.lg,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: espaco.md + 2,
  },

  nomeProduto: {
    fontSize: fonte.subtitulo,
    fontWeight: "700",
  },

  preco: {
    marginTop: 4,
    fontWeight: "800",
    fontSize: fonte.corpo,
  },

  quantidade: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: 4,
  },

  botaoQtd: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },

  qtdTexto: {
    minWidth: 22,
    textAlign: "center",
    fontSize: fonte.corpo,
    fontWeight: "800",
  },

  retirada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: espaco.lg,
    marginBottom: espaco.md,
  },

  opcao: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: raio.md,
    padding: espaco.md,
    marginTop: espaco.sm + 2,
  },

  opcaoIcone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: espaco.md,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginLeft: espaco.md,
    justifyContent: "center",
    alignItems: "center",
  },

  radioMiolo: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  novoCartao: {
    marginTop: espaco.md,
    marginBottom: 4,
  },

  linhaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: espaco.md,
  },

  resumo: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderTopWidth: 1,
    marginTop: espaco.xl,
    paddingTop: espaco.lg,
    marginBottom: espaco.lg,
  },

  resumoRotulo: {
    fontSize: fonte.subtitulo,
    fontWeight: "600",
  },

  total: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
});