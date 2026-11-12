import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Cartao, Chip } from "./UI";
import { textoHorario } from "../data/restaurantes";
import { espaco, fonte } from "../theme/tema";

// Cartão de restaurante usado na Home, na Busca e nos Favoritos.
// `children` aparece no rodapé do cartão (ex.: botão "Remover").
export default function CartaoRestaurante({ restaurante, cores, onPress, children }) {
  const horario = textoHorario(restaurante);
  const inicial = (restaurante.nome || "?").trim().charAt(0).toUpperCase();

  return (
    <Cartao
      cores={cores}
      onPress={onPress}
      estilo={styles.cartao}
    >
      <View style={[styles.capa, { backgroundColor: cores.principalSuave }]}>
        {restaurante.imagem_capa_url ? (
          <Image
            source={{ uri: restaurante.imagem_capa_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="restaurant" size={44} color={cores.principal} style={{ opacity: 0.3 }} />
        )}
      </View>

      <View style={styles.corpo}>
        <View
          style={[
            styles.logo,
            { backgroundColor: cores.principal, borderColor: cores.card },
          ]}
        >
          {restaurante.logo_url ? (
            <Image source={{ uri: restaurante.logo_url }} style={styles.logoImagem} />
          ) : (
            <Text style={styles.logoInicial}>{inicial}</Text>
          )}
        </View>

        <Text style={[styles.nome, { color: cores.texto }]} numberOfLines={1}>
          {restaurante.nome}
        </Text>

        {!!restaurante.descricao && (
          <Text
            style={[styles.descricao, { color: cores.secundario }]}
            numberOfLines={2}
          >
            {restaurante.descricao}
          </Text>
        )}

        {!!horario && (
          <Chip
            cores={cores}
            tom="principal"
            icone="time-outline"
            texto={horario}
            estilo={{ marginTop: espaco.md }}
          />
        )}

        {children}
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: {
    padding: 0,
    overflow: "hidden",
    marginBottom: espaco.lg,
  },

  capa: {
    height: 116,
    alignItems: "center",
    justifyContent: "center",
  },

  corpo: {
    paddingHorizontal: espaco.lg,
    paddingBottom: espaco.lg,
  },

  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    marginTop: -28,
    marginBottom: espaco.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logoImagem: {
    width: "100%",
    height: "100%",
  },

  logoInicial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  nome: {
    fontSize: fonte.titulo - 3,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  descricao: {
    marginTop: 4,
    fontSize: fonte.corpo - 1,
    lineHeight: 20,
  },
});