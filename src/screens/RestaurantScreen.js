import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { carrinho } from "../data/carrinho";
import { favoritos } from "../data/favoritos";
import { listarProdutos, textoHorario } from "../data/restaurantes";
import { ThemeContext } from "../context/ThemeContext";
import { Botao, Cartao, Chip, EstadoVazio, Tela } from "../components/UI";
import { espaco, fonte, raio, sombra } from "../theme/tema";


export default function RestaurantScreen({
  route,
  navigation,
}) {
  const { restaurante } = route.params;

  const { cores } = useContext(ThemeContext);

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [favoritado, setFavoritado] = useState(
    favoritos.some((item) => item.id === restaurante.id)
  );
  const [, atualizarCarrinho] = useState(0);

  // Cardápio vem do banco: os mesmos produtos que o restaurante cadastra no painel.
  useEffect(() => {
    let ativo = true;

    listarProdutos(restaurante.id).then(({ data, error }) => {
      if (!ativo) return;

      if (error) {
        setErro(error.message);
      } else {
        setProdutos(data || []);
      }

      setCarregando(false);
    });

    return () => {
      ativo = false;
    };
  }, [restaurante.id]);

  function inserirNoCarrinho(produto) {
    const chaveProduto = `${restaurante.id}-${produto.id}`;

    const itemExistente = carrinho.find(
      (item) => item.chaveProduto === chaveProduto
    );

    if (itemExistente) {
      itemExistente.quantidade += 1;
    } else {
      carrinho.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        chaveProduto,
        restauranteId: restaurante.id,
        restauranteNome: restaurante.nome,
        restauranteEndereco: restaurante.endereco || "",
        quantidade: 1,
      });
    }

    atualizarCarrinho((n) => n + 1);

    Alert.alert(
      "Sucesso",
      `${produto.nome} adicionado ao carrinho`
    );
  }

  // Um pedido pertence a um único restaurante.
  function adicionarCarrinho(produto) {
    if (
      carrinho.length > 0 &&
      carrinho[0].restauranteId !== restaurante.id
    ) {
      Alert.alert(
        "Carrinho de outro restaurante",
        `Seu carrinho tem itens de ${carrinho[0].restauranteNome}. Deseja esvaziá-lo e começar um novo pedido aqui?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Esvaziar e adicionar",
            style: "destructive",
            onPress: () => {
              carrinho.length = 0;
              inserirNoCarrinho(produto);
            },
          },
        ]
      );
      return;
    }

    inserirNoCarrinho(produto);
  }

  function favoritarRestaurante() {
    const existe = favoritos.find(
      (item) => item.id === restaurante.id
    );

    if (existe) {
      Alert.alert("Aviso", "Restaurante já favoritado");
      return;
    }

    favoritos.push(restaurante);
    setFavoritado(true);

    Alert.alert(
      "Sucesso",
      "Restaurante adicionado aos favoritos"
    );
  }

  const insets = useSafeAreaInsets();
  const horario = textoHorario(restaurante);
  const inicial = (restaurante.nome || "?").trim().charAt(0).toUpperCase();
  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const totalValor = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  const cabecalho = (
    <View>
      <View style={[styles.capa, { backgroundColor: cores.principalSuave }]}>
        {restaurante.imagem_capa_url ? (
          <Image
            source={{ uri: restaurante.imagem_capa_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="restaurant" size={56} color={cores.principal} style={{ opacity: 0.3 }} />
        )}
      </View>

      <View style={styles.identidade}>
        <View style={styles.linhaTopo}>
          <View
            style={[
              styles.logo,
              { backgroundColor: cores.principal, borderColor: cores.fundo },
            ]}
          >
            {restaurante.logo_url ? (
              <Image source={{ uri: restaurante.logo_url }} style={styles.logoImagem} />
            ) : (
              <Text style={styles.logoInicial}>{inicial}</Text>
            )}
          </View>

          <Pressable
            onPress={favoritarRestaurante}
            accessibilityRole="button"
            accessibilityLabel="Favoritar"
            style={[
              styles.favorito,
              {
                backgroundColor: favoritado ? cores.principalSuave : cores.card,
                borderColor: favoritado ? cores.principal : cores.borda,
              },
            ]}
          >
            <Ionicons
              name={favoritado ? "heart" : "heart-outline"}
              size={21}
              color={favoritado ? cores.principal : cores.texto}
            />
            <Text
              style={[
                styles.favoritoTexto,
                { color: favoritado ? cores.principal : cores.texto },
              ]}
            >
              {favoritado ? "Favoritado" : "Favoritar"}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.nome, { color: cores.texto }]}>
          {restaurante.nome}
        </Text>

        {!!restaurante.descricao && (
          <Text style={[styles.descricao, { color: cores.secundario }]}>
            {restaurante.descricao}
          </Text>
        )}

        <View style={styles.infos}>
          {!!horario && (
            <Chip cores={cores} tom="principal" icone="time-outline" texto={horario} />
          )}
          <Chip cores={cores} icone="bag-handle-outline" texto="Retirada no local" />
        </View>

        {!!restaurante.endereco && (
          <View style={styles.endereco}>
            <Ionicons name="location-outline" size={16} color={cores.secundario} />
            <Text style={[styles.enderecoTexto, { color: cores.secundario }]}>
              {restaurante.endereco}
            </Text>
          </View>
        )}

        <Text style={[styles.tituloProdutos, { color: cores.texto }]}>
          Cardápio
        </Text>
      </View>
    </View>
  );

  return (
    <Tela cores={cores}>
      <FlatList
        style={{ flex: 1 }}
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={cabecalho}
        contentContainerStyle={{
          paddingBottom: (totalItens > 0 ? 96 : 24) + insets.bottom,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EstadoVazio
            cores={cores}
            icone={erro ? "alert-circle-outline" : "fast-food-outline"}
            titulo={
              erro
                ? "Não foi possível carregar"
                : carregando
                ? "Carregando..."
                : "Este restaurante ainda não cadastrou produtos."
            }
            texto={erro ? `Erro ao carregar: ${erro}` : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.itemLista}>
            <Cartao cores={cores} estilo={styles.produto}>
              {!!item.imagem_url && (
                <Image source={{ uri: item.imagem_url }} style={styles.produtoImagem} />
              )}

              <View style={{ flex: 1, paddingRight: espaco.sm }}>
                <Text style={[styles.produtoNome, { color: cores.texto }]}>
                  {item.nome}
                </Text>

                {!!item.descricao && (
                  <Text
                    style={[styles.produtoDescricao, { color: cores.secundario }]}
                    numberOfLines={2}
                  >
                    {item.descricao}
                  </Text>
                )}

                <Text style={[styles.preco, { color: cores.principal }]}>
                  R$ {Number(item.preco).toFixed(2)}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.botao,
                  { backgroundColor: cores.principal },
                  sombra(cores, 2),
                  pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
                ]}
                onPress={() => adicionarCarrinho(item)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${item.nome} ao carrinho`}
              >
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </Pressable>
            </Cartao>
          </View>
        )}
      />

      {totalItens > 0 && (
        <View
          style={[
            styles.barraCarrinho,
            { paddingBottom: insets.bottom + espaco.md, backgroundColor: cores.fundo, borderTopColor: cores.borda },
          ]}
        >
          <Botao
            cores={cores}
            icone="cart"
            titulo={`Ver Carrinho · ${totalItens} ${totalItens === 1 ? "item" : "itens"} · R$ ${totalValor.toFixed(2)}`}
            onPress={() => navigation.navigate("Carrinho")}
          />
        </View>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  capa: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },

  identidade: {
    paddingHorizontal: espaco.xl,
  },

  linhaTopo: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: -36,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
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
    fontSize: 30,
    fontWeight: "800",
  },

  favorito: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: raio.pill,
    borderWidth: 1.5,
    marginBottom: 4,
  },

  favoritoTexto: {
    marginLeft: 6,
    fontSize: fonte.corpo - 1,
    fontWeight: "700",
  },

  nome: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: espaco.md,
  },

  descricao: {
    marginTop: 6,
    fontSize: fonte.corpo,
    lineHeight: 22,
  },

  infos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espaco.sm,
    marginTop: espaco.lg,
  },

  endereco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: espaco.md,
  },

  enderecoTexto: {
    flex: 1,
    fontSize: fonte.corpo - 1,
  },

  tituloProdutos: {
    fontSize: fonte.titulo,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: espaco.xxl,
    marginBottom: espaco.md,
  },

  itemLista: {
    paddingHorizontal: espaco.xl,
    marginBottom: espaco.md,
  },

  produto: {
    flexDirection: "row",
    alignItems: "center",
    padding: espaco.md,
  },

  produtoImagem: {
    width: 76,
    height: 76,
    borderRadius: raio.md,
    marginRight: espaco.md,
  },

  produtoNome: {
    fontSize: fonte.subtitulo,
    fontWeight: "700",
  },

  produtoDescricao: {
    marginTop: 2,
    fontSize: fonte.corpo - 1,
    lineHeight: 19,
  },

  preco: {
    marginTop: 6,
    fontSize: fonte.subtitulo,
    fontWeight: "800",
  },

  botao: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  barraCarrinho: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.md,
    borderTopWidth: 1,
  },
});