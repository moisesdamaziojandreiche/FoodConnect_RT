import React, { useContext, useState } from "react";
import {
  View,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";
import { ThemeContext } from "../context/ThemeContext";
import { Botao, Campo, Tela } from "../components/UI";
import { espaco, fonte, raio, sombra } from "../theme/tema";

const logo = require("../../assets/FoodConnectImage.png");


export default function LoginScreen({ navigation }) {
  const { cores } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function fazerLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      Alert.alert("Erro", "E-mail ou senha incorretos");
      return;
    }

    navigation.replace("Home");
  }

  return (
    <Tela cores={cores} topo>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Selo claro: a logo tem texto escuro e precisa funcionar no tema escuro */}
          <View style={[styles.selo, sombra(cores, 2)]}>
            <Image source={logo} style={styles.logo} />
          </View>

          <Text style={[styles.titulo, { color: cores.texto }]}>
            Bem-vindo de volta
          </Text>
          <Text style={[styles.subtitulo, { color: cores.secundario }]}>
            Entre para pedir dos seus restaurantes favoritos.
          </Text>

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
            icone="lock-closed-outline"
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <Pressable
            onPress={() => navigation.navigate("RecuperarSenha")}
            style={styles.esqueci}
            hitSlop={8}
          >
            <Text style={[styles.link, { color: cores.principal }]}>
              Esqueceu sua senha?
            </Text>
          </Pressable>

          <Botao cores={cores} titulo="Entrar" onPress={fazerLogin} />

          <View style={styles.divisor}>
            <View style={[styles.linha, { backgroundColor: cores.borda }]} />
            <Text style={[styles.divisorTexto, { color: cores.secundario }]}>
              ainda não tem conta?
            </Text>
            <View style={[styles.linha, { backgroundColor: cores.borda }]} />
          </View>

          <Botao
            cores={cores}
            titulo="Cadastre-se"
            variante="secundario"
            onPress={() => navigation.navigate("Cadastro")}
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
    marginBottom: espaco.xxl,
  },

  logo: {
    width: 170,
    height: 170,
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

  esqueci: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: espaco.lg,
  },

  link: {
    fontSize: fonte.corpo - 1,
    fontWeight: "700",
  },

  divisor: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: espaco.xl,
  },

  linha: {
    flex: 1,
    height: 1,
  },

  divisorTexto: {
    marginHorizontal: espaco.md,
    fontSize: fonte.pequena,
  },
});