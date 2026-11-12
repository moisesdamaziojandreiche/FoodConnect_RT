import React, { useContext, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { carrinho } from "../data/carrinho";
import { ThemeContext } from "../context/ThemeContext";
import { ALTURA_MENU } from "./UI";
import { fonte } from "../theme/tema";

const ABAS = [
  { rota: "Home", rotulo: "Início", icone: "home" },
  { rota: "Buscar", rotulo: "Buscar", icone: "search" },
  { rota: "Carrinho", rotulo: "Carrinho", icone: "cart" },
  { rota: "Pedidos", rotulo: "Pedidos", icone: "receipt" },
  { rota: "Perfil", rotulo: "Conta", icone: "person" },
];

export default function Menu({
  navigation,
}) {
  const { cores } = useContext(ThemeContext);
  const rota = useRoute();
  const insets = useSafeAreaInsets();
  const [, atualizar] = useState(0);

  // O carrinho é uma lista em memória: recalcula o contador quando a tela ganha foco.
  useEffect(
    () => navigation.addListener("focus", () => atualizar((n) => n + 1)),
    [navigation]
  );

  const itensNoCarrinho = carrinho.reduce(
    (soma, item) => soma + item.quantidade,
    0
  );

  return (
    <View
      style={[
        styles.menu,
        {
          height: ALTURA_MENU + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: cores.fundo,
          borderTopColor: cores.borda,
        },
      ]}
    >
      {ABAS.map((aba) => {
        const ativa = rota.name === aba.rota;
        const cor = ativa ? cores.principal : cores.secundario;

        return (
          <Pressable
            key={aba.rota}
            style={styles.aba}
            onPress={() => navigation.navigate(aba.rota)}
            accessibilityRole="button"
            accessibilityLabel={aba.rotulo}
          >
            <View
              style={[
                styles.pilula,
                ativa && { backgroundColor: cores.principalSuave },
              ]}
            >
              <Ionicons
                name={ativa ? aba.icone : `${aba.icone}-outline`}
                size={22}
                color={cor}
              />

              {aba.rota === "Carrinho" && itensNoCarrinho > 0 && (
                <View style={[styles.selo, { backgroundColor: cores.principal, borderColor: cores.fundo }]}>
                  <Text style={styles.seloTexto}>
                    {itensNoCarrinho > 9 ? "9+" : itensNoCarrinho}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.rotulo, { color: cor }, ativa && styles.rotuloAtivo]}>
              {aba.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    flexDirection: "row",
    alignItems: "center",

    borderTopWidth: 1,
  },

  aba: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },

  pilula: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  rotulo: {
    marginTop: 3,
    fontSize: fonte.micro,
    fontWeight: "600",
  },

  rotuloAtivo: {
    fontWeight: "800",
  },

  selo: {
    position: "absolute",
    top: -4,
    right: 4,

    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,

    alignItems: "center",
    justifyContent: "center",
  },

  seloTexto: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});