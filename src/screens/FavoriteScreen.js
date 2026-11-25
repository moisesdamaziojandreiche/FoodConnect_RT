import React, { useContext } from "react";
import {
  FlatList,
} from "react-native";
import { Alert } from "../lib/avisos";

import { favoritos } from "../data/favoritos";
import Menu from "../components/Menu";
import CartaoRestaurante from "../components/CartaoRestaurante";
import { Botao, EstadoVazio, Tela, useRespiroMenu } from "../components/UI";
import { ThemeContext } from "../context/ThemeContext";
import { espaco } from "../theme/tema";

export default function FavoriteScreen({
  navigation,
}) {
  const { cores } =
    useContext(ThemeContext);
  const respiro = useRespiroMenu();

  function removerFavorito(id) {
    const index = favoritos.findIndex(
      (item) => item.id === id
    );

    if (index !== -1) {
      favoritos.splice(index, 1);

      Alert.alert(
        "Sucesso",
        "Restaurante removido dos favoritos"
      );

      navigation.replace(
        "Favoritos"
      );
    }
  }

  return (
    <Tela cores={cores}>
      {favoritos.length === 0 ? (
        <EstadoVazio
          cores={cores}
          icone="heart-outline"
          titulo="Nenhum restaurante favoritado."
          texto="Toque no coração dentro de um restaurante para guardá-lo aqui."
        />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) =>
            item.id.toString()
          }
          contentContainerStyle={{
            padding: espaco.xl,
            paddingBottom: respiro,
          }}
          showsVerticalScrollIndicator={false}
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
            >
              <Botao
                cores={cores}
                titulo="Remover"
                icone="heart-dislike-outline"
                variante="perigo"
                pequeno
                estilo={{ marginTop: espaco.md }}
                onPress={() =>
                  removerFavorito(
                    item.id
                  )
                }
              />
            </CartaoRestaurante>
          )}
        />
      )}

      <Menu navigation={navigation} />
    </Tela>
  );
}