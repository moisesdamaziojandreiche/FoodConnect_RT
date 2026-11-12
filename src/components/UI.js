// Tokens de design do app FoodConnect.
// As CORES ficam em src/context/ThemeContext.js (claro/escuro).

import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const raio = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const fonte = {
  micro: 11,
  pequena: 13,
  corpo: 15,
  subtitulo: 17,
  titulo: 22,
  tela: 30,
};

// Sombra suave; no tema escuro a separação vem da borda.
export function sombra(cores, nivel = 1) {
  if (cores.escuro) return {};

  return Platform.select({
    web: {
      boxShadow: `0 ${nivel * 2}px ${nivel * 8}px rgba(60, 25, 0, ${(0.05 + nivel * 0.03).toFixed(2)})`,
    },
    default: {
      shadowColor: "#3C1900",
      shadowOffset: { width: 0, height: nivel * 2 },
      shadowOpacity: 0.05 + nivel * 0.03,
      shadowRadius: nivel * 5,
      elevation: nivel * 2,
    },
  });
}

export const ALTURA_MENU = 64;

export function useRespiroMenu() {
  const insets = useSafeAreaInsets();
  return ALTURA_MENU + insets.bottom + espaco.lg;
}

export function Tela({ cores, topo = false, children }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tela,
        { backgroundColor: cores.fundo, paddingTop: topo ? insets.top : 0 },
      ]}
    >
      {children}
    </View>
  );
}

export function Cabecalho({ cores, titulo, subtitulo, estilo }) {
  return (
    <View style={[styles.cabecalho, estilo]}>
      <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
      {!!subtitulo && (
        <Text style={[styles.subtitulo, { color: cores.secundario }]}>
          {subtitulo}
        </Text>
      )}
    </View>
  );
}

export function EstadoVazio({ cores, icone, titulo, texto }) {
  return (
    <View style={styles.estadoVazio}>
      {!!icone && (
        <View
          style={[
            styles.estadoIcone,
            { backgroundColor: cores.principalSuave },
          ]}
        >
          <Ionicons name={icone} size={30} color={cores.principal} />
        </View>
      )}
      <Text style={[styles.estadoTitulo, { color: cores.texto }]}>{titulo}</Text>
      {!!texto && (
        <Text style={[styles.estadoTexto, { color: cores.secundario }]}>
          {texto}
        </Text>
      )}
    </View>
  );
}

export function Cartao({ cores, estilo, onPress, children }) {
  const estiloBase = [
    styles.cartao,
    {
      backgroundColor: cores.card,
      borderColor: cores.borda,
    },
    sombra(cores),
    estilo,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [estiloBase, pressed && styles.pressionado]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={estiloBase}>{children}</View>;
}

export function Chip({
  cores,
  tom = "neutro",
  icone,
  texto,
  estilo,
}) {
  const tons = {
    principal: [cores.principalSuave, cores.principal],
    sucesso: [cores.sucessoSuave, cores.sucesso],
    alerta: [cores.alertaSuave, cores.alertaTexto],
    erro: [cores.erroSuave, cores.erro],
    neutro: [cores.card, cores.secundario],
  };
  const [fundo, cor] = tons[tom] || tons.neutro;

  return (
    <View style={[styles.chip, { backgroundColor: fundo }, estilo]}>
      {!!icone && <Ionicons name={icone} size={15} color={cor} />}
      <Text style={[styles.chipTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

export function Botao({
  cores,
  titulo,
  icone,
  variante = "principal",
  pequeno = false,
  desabilitado = false,
  carregando = false,
  estilo,
  onPress,
}) {
  const variantes = {
    principal: {
      backgroundColor: cores.principal,
      borderColor: cores.principal,
      color: cores.sobrePrincipal,
    },
    secundario: {
      backgroundColor: cores.principalSuave,
      borderColor: cores.principalSuave,
      color: cores.principal,
    },
    perigo: {
      backgroundColor: cores.erroSuave,
      borderColor: cores.erroSuave,
      color: cores.erro,
    },
    fantasma: {
      backgroundColor: "transparent",
      borderColor: cores.borda,
      color: cores.texto,
    },
  };
  const aparencia = variantes[variante] || variantes.principal;

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado || carregando}
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado || carregando }}
      style={({ pressed }) => [
        styles.botao,
        {
          backgroundColor: aparencia.backgroundColor,
          borderColor: aparencia.borderColor,
          minHeight: pequeno ? 38 : 50,
          paddingHorizontal: pequeno ? espaco.md : espaco.lg,
        },
        !pequeno && sombra(cores, 1),
        (desabilitado || carregando) && styles.botaoDesabilitado,
        pressed && !desabilitado && !carregando && styles.pressionado,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={aparencia.color} />
      ) : (
        <>
          {!!icone && <Ionicons name={icone} size={18} color={aparencia.color} />}
          <Text style={[styles.botaoTexto, { color: aparencia.color }, pequeno && styles.botaoTextoPequeno]}>
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({
  cores,
  icone,
  containerStyle,
  style,
  ...props
}) {
  return (
    <View
      style={[
        styles.campo,
        { backgroundColor: cores.campo, borderColor: cores.campoBorda },
        containerStyle,
      ]}
    >
      {!!icone && (
        <Ionicons
          name={icone}
          size={19}
          color={cores.secundario}
          style={styles.campoIcone}
        />
      )}
      <TextInput
        placeholderTextColor={cores.secundario}
        selectionColor={cores.principal}
        style={[styles.campoTexto, { color: cores.texto }, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },

  cabecalho: {
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.lg,
    paddingBottom: espaco.lg,
  },

  titulo: {
    fontSize: fonte.tela,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  subtitulo: {
    marginTop: 4,
    fontSize: fonte.corpo,
    lineHeight: 21,
  },

  estadoVazio: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espaco.xl,
  },

  estadoIcone: {
    width: 64,
    height: 64,
    borderRadius: raio.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: espaco.lg,
  },

  estadoTitulo: {
    fontSize: fonte.subtitulo,
    fontWeight: "700",
    textAlign: "center",
  },

  estadoTexto: {
    maxWidth: 320,
    marginTop: espaco.sm,
    fontSize: fonte.corpo - 1,
    lineHeight: 21,
    textAlign: "center",
  },

  cartao: {
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: espaco.xs,
    borderRadius: raio.pill,
    paddingHorizontal: espaco.md,
    paddingVertical: 6,
  },

  chipTexto: {
    fontSize: fonte.pequena,
    fontWeight: "700",
  },

  botao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.sm,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingVertical: espaco.md,
  },

  botaoTexto: {
    fontSize: fonte.corpo,
    fontWeight: "800",
  },

  botaoTextoPequeno: {
    fontSize: fonte.pequena,
  },

  botaoDesabilitado: {
    opacity: 0.55,
  },

  pressionado: {
    opacity: 0.82,
  },

  campo: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },

  campoIcone: {
    marginRight: espaco.md,
  },

  campoTexto: {
    flex: 1,
    minWidth: 0,
    paddingVertical: espaco.md,
    fontSize: fonte.corpo,
  },
});