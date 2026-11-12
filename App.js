import React, { useContext } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import HomeScreen from "./src/screens/HomeScreen";
import RestaurantScreen from "./src/screens/RestaurantScreen";
import CartScreen from "./src/screens/CartScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SearchScreen from "./src/screens/SearchScreen";
import {ThemeProvider, ThemeContext} from "./src/context/ThemeContext";
import FavoriteScreen from "./src/screens/FavoriteScreen";
import CardsScreen from "./src/screens/CardsScreen";
import OrdersScreen from "./src/screens/OrdersScreen";



const Stack = createNativeStackNavigator();

// Fica dentro do ThemeProvider para o navegador seguir o tema claro/escuro.
function Rotas() {
  const { cores, temaEscuro } = useContext(ThemeContext);

  const base = temaEscuro ? DarkTheme : DefaultTheme;

  const temaNavegacao = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.principal,
      background: cores.fundo,
      card: cores.fundo,
      text: cores.texto,
      border: cores.borda,
    },
  };

  // Telas "de aba" (têm Menu inferior e título próprio) ficam sem cabeçalho nativo.
  const semCabecalho = { headerShown: false };

  return (
    <NavigationContainer theme={temaNavegacao}>
      <StatusBar style={temaEscuro ? "light" : "dark"} />

      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: cores.principal,
          headerTitleStyle: {
            color: cores.texto,
            fontWeight: "800",
          },
          headerStyle: {
            backgroundColor: cores.fundo,
          },
          contentStyle: {
            backgroundColor: cores.fundo,
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={semCabecalho}
        />

        <Stack.Screen
          name="Cadastro"
          component={RegisterScreen}
          options={{
            title: "",
            headerBackTitle: "Voltar",
          }}
        />

        <Stack.Screen
          name="RecuperarSenha"
          component={ForgotPasswordScreen}
          options={{
            title: "Recuperar Senha",
            headerBackTitle: "Voltar",
          }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={semCabecalho}
        />

        <Stack.Screen
          name="Restaurant"
          component={RestaurantScreen}
          options={{
            title: "Restaurante",
            headerBackTitle: "Voltar",
          }}
        />

        <Stack.Screen
          name="Carrinho"
          component={CartScreen}
          options={semCabecalho}
        />

        <Stack.Screen
          name="Perfil"
          component={ProfileScreen}
          options={semCabecalho}
        />

        <Stack.Screen
          name="Buscar"
          component={SearchScreen}
          options={semCabecalho}
        />

        <Stack.Screen
          name="Favoritos"
          component={FavoriteScreen}
          options={{
            title: "Favoritos",
            headerBackTitle: "Voltar",
          }}
        />

        <Stack.Screen
          name="Cartoes"
          component={CardsScreen}
          options={{
            title: "Meus cartões",
            headerBackTitle: "Voltar",
          }}
        />

        <Stack.Screen
          name="Pedidos"
          component={OrdersScreen}
          options={semCabecalho}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Rotas />
    </ThemeProvider>
  );
}