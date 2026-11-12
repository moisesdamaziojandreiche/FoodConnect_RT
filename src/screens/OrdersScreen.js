import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../lib/supabase";
import Menu from "../components/Menu";
import { Botao, Cabecalho, Cartao, Chip, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { ThemeContext } from "../context/ThemeContext";
import { espaco, fonte } from "../theme/tema";

// Mesmos status que o painel do restaurante usa (check de pedidos.status no banco).
function textoStatus(pedido) {
  const retirada = !pedido.endereco_entrega;

  switch (pedido.status) {
    case "aguardando_pagamento":
      return "Aguardando pagamento";
    case "pendente":
      return "Pagamento aprovado — aguardando o restaurante";
    case "aceito":
      return "Pedido aceito";
    case "preparando":
      return "Em preparo";
    case "pronto":
      return retirada ? "Pronto para retirada" : "Pronto";
    case "saiu_para_entrega":
      return "Saiu para entrega";
    case "entregue":
      return retirada ? "Retirado" : "Entregue";
    case "cancelado":
      return pedido.payment_status === "reembolsado"
        ? "Cancelado — pagamento reembolsado"
        : "Cancelado";
    default:
      return pedido.status;
  }
}

// Cor e ícone do selo de status (mesma lógica de cores do painel do restaurante).
function tomStatus(status) {
  switch (status) {
    case "aguardando_pagamento":
      return { tom: "alerta", icone: "card-outline" };
    case "pendente":
    case "aceito":
    case "preparando":
      return { tom: "principal", icone: "flame-outline" };
    case "pronto":
    case "saiu_para_entrega":
      return { tom: "sucesso", icone: "checkmark-circle-outline" };
    case "entregue":
      return { tom: "neutro", icone: "bag-check-outline" };
    case "cancelado":
      return { tom: "erro", icone: "close-circle-outline" };
    default:
      return { tom: "neutro", icone: "ellipse-outline" };
  }
}

export default function OrdersScreen({ navigation }) {
  const { cores } = useContext(ThemeContext);
  const respiro = useRespiroMenu();

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!supabase.from) {
      setErro("Supabase não configurado");
      setCarregando(false);
      return;
    }

    // A RLS já garante que só voltam os pedidos do próprio cliente.
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        "id, status, payment_status, valor_total, endereco_entrega, asaas_invoice_url, created_at, empresas(nome, endereco)"
      )
      .order("created_at", { ascending: false });

    setErro(error ? error.message : null);
    setPedidos(data || []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();

    if (!supabase.channel) return undefined;

    let canal;
    let cancelado = false;

    // Tempo real: quando o restaurante muda o status no painel, a lista atualiza.
    supabase.auth.getUser().then(({ data }) => {
      const usuario = data?.user;
      if (!usuario || cancelado) return;

      canal = supabase
        .channel(`meus-pedidos-${usuario.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "pedidos",
            filter: `cliente_id=eq.${usuario.id}`,
          },
          () => carregar()
        )
        .subscribe();
    });

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [carregar]);

  return (
    <Tela cores={cores} topo>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        refreshing={carregando}
        onRefresh={carregar}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: espaco.xl,
          paddingBottom: respiro,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <Cabecalho
            cores={cores}
            titulo="Meus Pedidos"
            subtitulo="Acompanhe em tempo real"
            estilo={{ paddingHorizontal: 0 }}
          />
        }
        ListEmptyComponent={
          <EstadoVazio
            cores={cores}
            icone={erro ? "alert-circle-outline" : "receipt-outline"}
            titulo={
              erro
                ? "Não foi possível carregar"
                : carregando
                ? "Carregando..."
                : "Você ainda não fez pedidos."
            }
            texto={erro ? `Erro ao carregar: ${erro}` : undefined}
          />
        }
        renderItem={({ item }) => {
          const { tom, icone } = tomStatus(item.status);

          return (
            <Cartao cores={cores} estilo={styles.card}>
              <View style={styles.topo}>
                <View style={[styles.avatar, { backgroundColor: cores.principalSuave }]}>
                  <Ionicons name="restaurant" size={18} color={cores.principal} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.restaurante, { color: cores.texto }]} numberOfLines={1}>
                    {item.empresas?.nome || "Restaurante"}
                  </Text>
                  <Text style={{ color: cores.secundario, fontSize: fonte.pequena }}>
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </Text>
                </View>

                <Text style={[styles.valor, { color: cores.texto }]}>
                  R$ {Number(item.valor_total).toFixed(2)}
                </Text>
              </View>

              <View style={[styles.divisor, { borderTopColor: cores.borda }]} />

              <Chip cores={cores} tom={tom} icone={icone} texto={textoStatus(item)} />

              {item.status === "pronto" &&
                !item.endereco_entrega &&
                !!item.empresas?.endereco && (
                  <View style={styles.retire}>
                    <Ionicons name="location-outline" size={16} color={cores.secundario} />
                    <Text style={{ color: cores.texto, flex: 1 }}>
                      Retire em: {item.empresas.endereco}
                    </Text>
                  </View>
                )}

              {item.status === "aguardando_pagamento" &&
                item.payment_status === "pendente" &&
                !!item.asaas_invoice_url && (
                  <Botao
                    cores={cores}
                    titulo="Pagar agora"
                    icone="wallet-outline"
                    pequeno
                    estilo={{ marginTop: espaco.md }}
                    onPress={() => WebBrowser.openBrowserAsync(item.asaas_invoice_url)}
                  />
                )}
            </Cartao>
          );
        }}
      />

      <Menu navigation={navigation} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: espaco.md,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  restaurante: {
    fontSize: fonte.subtitulo,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  valor: {
    fontSize: fonte.subtitulo,
    fontWeight: "800",
  },

  divisor: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginVertical: espaco.md,
  },

  retire: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: espaco.md,
  },
});