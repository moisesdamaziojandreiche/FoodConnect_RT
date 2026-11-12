import React, { useState, useContext} from "react";
import { FlatList, View } from "react-native";

import { useRestaurantes } from "../data/restaurantes";
import Menu from "../components/Menu";
import CartaoRestaurante from "../components/CartaoRestaurante";
import { Cabecalho, Campo, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { ThemeContext } from "../context/ThemeContext";
import { espaco } from "../theme/tema";

export default function SearchScreen({
  navigation,
}) {
  const [busca, setBusca] = useState("");
  const { cores } = useContext(ThemeContext);
  const { restaurantes, carregando, erro } = useRestaurantes();
  const respiro = useRespiroMenu();

  const resultado = restaurantes.filter((r) =>
    r.nome
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
    <Tela cores={cores} topo>
      <Cabecalho cores={cores} titulo="Buscar" subtitulo="Encontre um restaurante pelo nome" />

      <View style={{ paddingHorizontal: espaco.xl }}>
        <Campo
          cores={cores}
          icone="search-outline"
          placeholder="Buscar restaurante..."
          value={busca}
          onChangeText={setBusca}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={resultado}
        contentContainerStyle={{
          paddingHorizontal: espaco.xl,
          paddingTop: espaco.sm,
          paddingBottom: respiro,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EstadoVazio
            cores={cores}
            icone={erro ? "alert-circle-outline" : "search-outline"}
            titulo={
              carregando
                ? "Carregando restaurantes..."
                : erro
                ? "Não foi possível carregar"
                : busca
                ? "Nenhum restaurante encontrado."
                : "Nenhum restaurante disponível."
            }
            texto={erro ? `Erro ao carregar restaurantes: ${erro}` : undefined}
          />
        }
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <CartaoRestaurante
            restaurante={item}
            cores={cores}
            onPress={() =>
              navigation.navigate(
                "Restaurant",
                {
                  restaurante: item,
                }
              )
            }
          />
        )}
      />

      <Menu navigation={navigation} />
    </Tela>
  );
}