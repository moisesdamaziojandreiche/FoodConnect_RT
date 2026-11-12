import React, { useContext } from "react";
import { FlatList } from "react-native";

import Menu from "../components/Menu";
import CartaoRestaurante from "../components/CartaoRestaurante";
import { Cabecalho, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { useRestaurantes } from "../data/restaurantes";
import { ThemeContext } from "../context/ThemeContext";
import { espaco } from "../theme/tema";

export default function HomeScreen({ navigation }) {
  const { cores } = useContext(ThemeContext);
  const { restaurantes, carregando, erro, recarregar } = useRestaurantes();
  const respiro = useRespiroMenu();

  return (
    <Tela cores={cores} topo>
      <FlatList
        data={restaurantes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingHorizontal: espaco.xl,
          paddingBottom: respiro,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={carregando}
        onRefresh={recarregar}
        ListHeaderComponent={
          <Cabecalho
            cores={cores}
            titulo="Restaurantes"
            subtitulo="O que vamos pedir hoje?"
            estilo={{ paddingHorizontal: 0 }}
          />
        }
        ListEmptyComponent={
          <EstadoVazio
            cores={cores}
            icone={erro ? "alert-circle-outline" : "restaurant-outline"}
            titulo={
              carregando
                ? "Carregando restaurantes..."
                : erro
                ? "Não foi possível carregar"
                : "Nenhum restaurante disponível"
            }
            texto={erro ? `Erro ao carregar restaurantes: ${erro}` : undefined}
          />
        }
        renderItem={({ item }) => (
          <CartaoRestaurante
            restaurante={item}
            cores={cores}
            onPress={() =>
              navigation.navigate("Restaurant", { restaurante: item })
            }
          />
        )}
      />
      <Menu navigation={navigation} />
    </Tela>
  );
}