import React, { useContext, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Alert } from "../lib/avisos";
import { supabase } from "../lib/supabase";
import { cpfValido, somenteDigitos } from "../../Cpf";
import { ThemeContext } from "../context/ThemeContext";
import { Botao, Campo, Tela } from "../components/UI";
import { espaco, fonte, raio, sombra } from "../theme/tema";

const logo = require("../../assets/FoodConnectImage.png");

export default function RegisterScreen({
  navigation,
}) {
  const { cores } = useContext(ThemeContext);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  async function cadastrar() {
    if (
      !nome ||
      !email ||
      !senha ||
      !confirmarSenha ||
      !cpf
    ) {
      Alert.alert(
        "Erro",
        "Preencha todos os campos"
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        "Erro",
        "As senhas não coincidem"
      );
      return;
    }

    // CPF obrigatório no cadastro: o pagamento (Pix ou cartão) e o salvamento de
    // cartão usam o CPF gravado em clientes.cpf, sem pedir de novo.
    if (!cpfValido(cpf)) {
      Alert.alert("Erro", "CPF inválido");
      return;
    }

    // Metadados lidos pelo trigger criar_conta_no_cadastro() do banco,
    // que cria a linha em public.clientes.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          tipo_cadastro: "cliente",
          nome: nome.trim(),
          cpf: somenteDigitos(cpf),
          telefone: telefone.trim(),
        },
      },
    });

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    if (!data.session) {
      Alert.alert("Cadastro realizado", "Confirme seu e-mail para entrar.");
      navigation.replace("Login");
      return;
    }

    Alert.alert("Sucesso", "Cadastro realizado!");
    navigation.replace("Home");
  }

  return (
    <Tela cores={cores}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.selo, sombra(cores, 2)]}>
            <Image source={logo} style={styles.logo} />
          </View>

          <Text style={[styles.titulo, { color: cores.texto }]}>
            Criar conta
          </Text>
          <Text style={[styles.subtitulo, { color: cores.secundario }]}>
            Leva menos de um minuto. Depois é só escolher o que comer.
          </Text>

          <Campo
            cores={cores}
            icone="person-outline"
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
          />

          <Campo
            cores={cores}
            icone="mail-outline"
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Campo
            cores={cores}
            icone="id-card-outline"
            placeholder="CPF"
            keyboardType="numeric"
            maxLength={14}
            value={cpf}
            onChangeText={setCpf}
          />

          <Campo
            cores={cores}
            icone="call-outline"
            placeholder="Telefone (opcional)"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />

          <Campo
            cores={cores}
            icone="lock-closed-outline"
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <Campo
            cores={cores}
            icone="shield-checkmark-outline"
            placeholder="Confirmar Senha"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          <Botao
            cores={cores}
            titulo="Cadastrar"
            onPress={cadastrar}
            estilo={{ marginTop: espaco.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: espaco.xxl,
    paddingVertical: espaco.xl,
  },

  selo: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: raio.lg + 6,
    padding: espaco.sm,
    marginBottom: espaco.xl,
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  subtitulo: {
    fontSize: fonte.corpo,
    marginTop: 4,
    marginBottom: espaco.xl,
  },
});