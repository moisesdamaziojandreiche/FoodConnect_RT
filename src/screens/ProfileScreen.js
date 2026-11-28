import React, { useContext } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../lib/supabase";
import Menu from "../components/Menu";
import { Botao, Cabecalho, Cartao, Tela, useRespiroMenu } from "../components/UI";
import { ThemeContext } from "../context/ThemeContext";
import { espaco, fonte } from "../theme/tema";

// Linha do menu de conta
function Linha({ cores, icone, titulo, detalhe, onPress, ultima, direita }) {
  const conteudo = (
    <View
      style={[
        styles.item,
        !ultima && { borderBottomWidth: 1, borderBottomColor: cores.borda },
      ]}
    >
      <View style={[styles.itemIcone, { backgroundColor: cores.principalSuave }]}>
        <Ionicons name={icone} size={19} color={cores.principal} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTexto, { color: cores.texto }]}>{titulo}</Text>
        {!!detalhe && (
          <Text style={{ color: cores.secundario, fontSize: fonte.pequena, marginTop: 1 }}>
            {detalhe}
          </Text>
        )}
      </View>

      {direita ??
        (onPress && (
          <Ionicons name="chevron-forward" size={18} color={cores.secundario} />
        ))}
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {conteudo}
    </Pressable>
  );
}

export default function ProfileScreen({
  navigation,
}) {
  const [userName, setUserName] = React.useState(null);
  const [userEmail, setUserEmail] = React.useState(null);
  const {
    temaEscuro,
    setTemaEscuro,
    cores,
  } = useContext(ThemeContext);
  const respiro = useRespiroMenu();

  React.useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        if (supabase && supabase.auth) {
          if (typeof supabase.auth.getUser === "function") {
            const { data, error } = await supabase.auth.getUser();
            const user = data?.user;
            if (user && mounted) {
              setUserName(user.user_metadata?.name || user.email);
              setUserEmail(user.email);
            }
          } else if (typeof supabase.auth.getSession === "function") {
            const { data } = await supabase.auth.getSession();
            const user = data?.session?.user;
            if (user && mounted) {
              setUserName(user.user_metadata?.name || user.email);
              setUserEmail(user.email);
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao obter usuário do Supabase:", e);
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const inicial = (userName ?? "U").trim().charAt(0).toUpperCase();

  return (
    <Tela cores={cores} topo>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: respiro }]}
        showsVerticalScrollIndicator={false}
      >
        <Cabecalho cores={cores} titulo="Conta" />

        <View style={styles.perfil}>
          <View style={[styles.avatar, { backgroundColor: cores.comida }]}>
            <Text style={styles.avatarInicial}>{inicial}</Text>
          </View>

          <Text style={[styles.nome, { color: cores.texto }]}>
            Olá, {userName ?? "Usuário"}
          </Text>

          <Text style={[styles.email, { color: cores.secundario }]}>
            {userEmail ?? ""}
          </Text>
        </View>

        <View style={{ paddingHorizontal: espaco.xl }}>
          <Cartao cores={cores} estilo={styles.menuCard}>
            <Linha
              cores={cores}
              icone={temaEscuro ? "moon" : "sunny"}
              titulo={temaEscuro ? "Tema Escuro" : "Tema Claro"}
              direita={
                <Switch
                  value={temaEscuro}
                  onValueChange={setTemaEscuro}
                  trackColor={{ true: cores.principal }}
                />
              }
            />

            <Linha
              cores={cores}
              icone="heart"
              titulo="Favoritos"
              detalhe="Restaurantes"
              onPress={() => navigation.navigate("Favoritos")}
            />

            <Linha
              cores={cores}
              icone="card"
              titulo="Meus cartões"
              detalhe="Pagamento"
              onPress={() => navigation.navigate("Cartoes")}
              ultima
            />
          </Cartao>
        </View>

        <View style={styles.footer}>
          <Botao
            cores={cores}
            titulo="Encerrar Sessão"
            icone="log-out-outline"
            variante="perigo"
                        onPress={async () => {
              await supabase.auth.signOut();
            }}
          />
        </View>
      </ScrollView>

      <Menu navigation={navigation} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  perfil: {
    alignItems: "center",
    marginBottom: espaco.xl,
  },

  conteudo: {
    flexGrow: 1,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaco.sm,
  },

  avatarInicial: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },

  nome: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: espaco.lg,
  },

  email: {
    marginTop: 2,
    fontSize: fonte.corpo,
  },

  menuCard: {
    paddingVertical: 4,
    paddingHorizontal: espaco.lg,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    paddingVertical: espaco.md + 2,
  },

  itemIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  itemTexto: {
    fontSize: fonte.corpo + 1,
    fontWeight: "600",
  },

  footer: {
    justifyContent: "flex-end",
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.xl,
  },
});