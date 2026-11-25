import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Alert } from "../lib/avisos";
import { Ionicons } from "@expo/vector-icons";

import Menu from "../components/Menu";
import CartaoForm from "../components/CartaoForm";
import { Botao, Campo, Cartao, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { ThemeContext } from "../context/ThemeContext";
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
  removerCartao,
  salvarCartao,
} from "../lib/cartoes";
import { espaco, fonte } from "../theme/tema";

export default function CardsScreen({ navigation }) {
  const { cores } = useContext(ThemeContext);
  const respiro = useRespiroMenu();

  const [cartoes, setCartoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  // Mensagem de erro/andamento mostrada na própria tela (não depende de alert do navegador).
  const [aviso, setAviso] = useState(null);

  // undefined = carregando | null = cliente ainda sem CPF cadastrado
  const [cpfCliente, setCpfCliente] = useState(undefined);
  const [cpf, setCpf] = useState("");
  const precisaCpf = cpfCliente === null;

  const carregar = useCallback(async () => {
    try {
      const [{ data, error }, cpfSalvo] = await Promise.all([
        listarCartoes(),
        buscarCpfCliente(),
      ]);

      setErro(error ? error.message : null);
      setCartoes(data || []);
      setCpfCliente(cpfSalvo);
    } catch (e) {
      // Sem isto o botão Salvar ficava desabilitado para sempre (cpfCliente indefinido).
      console.warn("[cartoes] falha ao carregar:", e);
      setErro(e?.message || "falha ao carregar");
      setCpfCliente(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function falhar(titulo, mensagem) {
    console.warn("[cartoes]", titulo, "-", mensagem);
    setAviso(`${titulo}: ${mensagem}`);
    Alert.alert(titulo, mensagem);
  }

  async function salvar() {
    setAviso(null);
    console.log("[cartoes] clicou em Salvar", { precisaCpf });

    if (precisaCpf && !cpfValido(soDigitos(cpf))) {
      falhar("CPF inválido", "Confira o CPF informado.");
      return;
    }

    const erroForm = validarCartao(form);
    if (erroForm) {
      falhar("Confira o cartão", erroForm);
      return;
    }

    setSalvando(true);
    console.log("[cartoes] enviando para salvar-cartao...");
    let resultado;
    try {
      resultado = await salvarCartao(form, precisaCpf ? cpf : null);
    } catch (e) {
      resultado = { cartao: null, erro: e?.message || "erro inesperado" };
    }
    setSalvando(false);
    const { cartao, erro: mensagem } = resultado;
    console.log("[cartoes] resposta:", cartao ? "ok" : mensagem);

    if (!cartao) {
      falhar("Não foi possível salvar o cartão", mensagem);
      return;
    }

    // Limpa o formulário: os dados do cartão não ficam na memória do app.
    setForm(FORM_VAZIO);
    setAdicionando(false);
    Alert.alert(
      "Cartão salvo",
      `${nomeBandeira(cartao.bandeira)} final ${cartao.ultimos_digitos} adicionado.`
    );
    carregar();
  }

  function confirmarRemocao(cartao) {
    Alert.alert(
      "Remover cartão",
      `Remover ${nomeBandeira(cartao.bandeira)} •••• ${cartao.ultimos_digitos}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const { error } = await removerCartao(cartao.id);
            if (error) Alert.alert("Erro ao remover", error.message);
            carregar();
          },
        },
      ]
    );
  }

  function cancelar() {
    setForm(FORM_VAZIO);
    setAdicionando(false);
  }

  return (
    <Tela cores={cores}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.conteudo, { paddingBottom: respiro + 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {carregando && (
            <EstadoVazio cores={cores} icone="card-outline" titulo="Carregando..." />
          )}

          {!!erro && (
            <EstadoVazio
              cores={cores}
              icone="alert-circle-outline"
              titulo="Não foi possível carregar"
              texto={`Erro ao carregar: ${erro}`}
            />
          )}

          {!carregando && !erro && cartoes.length === 0 && !adicionando && (
            <EstadoVazio
              cores={cores}
              icone="card-outline"
              titulo="Você ainda não salvou nenhum cartão."
              texto="Salve um cartão para pagar seus pedidos com um toque."
            />
          )}

          {cartoes.map((cartao) => (
            <Cartao
              key={cartao.id}
              cores={cores}
              estilo={styles.cartao}
            >
              <View style={[styles.cartaoIcone, { backgroundColor: cores.principalSuave }]}>
                <Ionicons name="card" size={22} color={cores.principal} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.cartaoNome, { color: cores.texto }]}>
                  {nomeBandeira(cartao.bandeira)}
                </Text>
                <Text style={[styles.cartaoNumero, { color: cores.secundario }]}>
                  •••• {cartao.ultimos_digitos}
                </Text>
              </View>

              <Botao
                cores={cores}
                titulo="Remover"
                variante="perigo"
                pequeno
                onPress={() => confirmarRemocao(cartao)}
              />
            </Cartao>
          ))}

          {!adicionando && (
            <Botao
              cores={cores}
              titulo="Adicionar cartão"
              icone="add"
              onPress={() => setAdicionando(true)}
              estilo={{ marginTop: espaco.sm }}
            />
          )}

          {adicionando && (
            <View style={styles.formulario}>
              <Text style={[styles.subtitulo, { color: cores.texto }]}>
                Novo cartão
              </Text>

              <CartaoForm valores={form} setValores={setForm} cores={cores} />

              {precisaCpf && (
                <Campo
                  cores={cores}
                  icone="id-card-outline"
                  containerStyle={{ marginTop: espaco.md }}
                  placeholder="Seu CPF"
                  keyboardType="number-pad"
                  maxLength={14}
                  value={cpf}
                  onChangeText={(t) => setCpf(mascararCpf(t))}
                />
              )}

              {!!aviso && (
                <Text style={{ color: cores.erro, marginTop: espaco.md, fontWeight: "600" }}>
                  {aviso}
                </Text>
              )}

              <Botao
                cores={cores}
                titulo={salvando ? "Salvando..." : "Salvar cartão"}
                icone={salvando ? undefined : "checkmark"}
                onPress={salvar}
                desabilitado={salvando || cpfCliente === undefined}
                estilo={{ marginTop: espaco.md }}
              />

              <Botao
                cores={cores}
                titulo="Cancelar"
                variante="fantasma"
                onPress={cancelar}
                desabilitado={salvando}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Menu navigation={navigation} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: espaco.xl,
  },

  subtitulo: {
    fontSize: fonte.titulo - 2,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: espaco.md,
  },

  cartao: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: espaco.md,
  },

  cartaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: espaco.md,
  },

  cartaoNome: {
    fontSize: fonte.subtitulo,
    fontWeight: "700",
  },

  cartaoNumero: {
    marginTop: 2,
    fontSize: fonte.corpo,
    letterSpacing: 1,
  },

  formulario: {
    marginTop: espaco.sm,
  },
});