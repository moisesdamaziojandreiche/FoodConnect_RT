import React, { useContext, useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { ThemeContext } from "../context/ThemeContext";
import { Botao, Campo, Tela } from "../components/UI";
import { espaco, fonte } from "../theme/tema";

export default function ForgotPasswordScreen({
  navigation,
}) {
  const { cores } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  async function alterarSenha() {
    if (!email) {
      Alert.alert("Erro", "Digite seu e-mail");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

  Alert.alert(
    "Sucesso",
    "Verifique seu e-mail para criar uma nova senha."
  );

  navigation.navigate("Login");
  }

  return (
    <Tela cores={cores}>
      <View style={styles.conteudo}>
        <View style={[styles.icone, { backgroundColor: cores.principalSuave }]}>
          <Ionicons name="key-outline" size={32} color={cores.principal} />
        </View>

        <Text style={[styles.titulo, { color: cores.texto }]}>
          Esqueceu a senha?
        </Text>
        <Text style={[styles.subtitulo, { color: cores.secundario }]}>
          Digite seu e-mail e enviaremos um link para criar uma nova senha.
        </Text>

        <Campo
          cores={cores}
          icone="mail-outline"
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Botao
          cores={cores}
          titulo="Alterar Senha"
          onPress={alterarSenha}
          estilo={{ marginTop: espaco.sm }}
        />
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: espaco.xxl,
  },

  icone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: espaco.xl,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  subtitulo: {
    fontSize: fonte.corpo,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: espaco.xl,
  },
});