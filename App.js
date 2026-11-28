import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
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
import { supabase } from "./src/lib/supabase";



const Stack = createNativeStackNavigator();
// Permite navegar de fora das telas (ex.: quando a sessão expira).
const navegacaoRef = createNavigationContainerRef();

// Fica dentro do ThemeProvider para o navegador seguir o tema claro/escuro.
function Rotas() {
  const { cores, temaEscuro } = useContext(ThemeContext);

    // null = ainda verificando a sessão salva
  const [rotaInicial, setRotaInicial] = useState(null);

  useEffect(() => {
    let ativo = true;

        async function verificarSessao() {
      try {
        if (typeof supabase.auth.getSession !== "function") {
          if (ativo) setRotaInicial("Login");
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (!data?.session) {
          if (ativo) setRotaInicial("Login");
          return;
        }

        // Confirma com o servidor que a sessão ainda vale.
        const { data: resposta, error } = await supabase.auth.getUser();

        if (resposta?.user) {
          if (ativo) setRotaInicial("Home");
          return;
        }

        // Sem internet: mantém o login e deixa o app tentar carregar.
        if (error?.name === "AuthRetryableFetchError") {
          if (ativo) setRotaInicial("Home");
          return;
        }

        // Sessão inválida ou expirada: limpa e pede login de novo.
        await supabase.auth.signOut();
        if (ativo) setRotaInicial("Login");
      } catch (e) {
        if (ativo) setRotaInicial("Login");
      }
    }

    verificarSessao();

    // Se a sessão acabar (logout ou token inválido), volta para o login.
    let assinatura = null;
    if (typeof supabase.auth.onAuthStateChange === "function") {
      const { data } = supabase.auth.onAuthStateChange((evento) => {
        if (evento === "SIGNED_OUT" && navegacaoRef.isReady()) {
          navegacaoRef.resetRoot({ index: 0, routes: [{ name: "Login" }] });
        }
      });
      assinatura = data?.subscription;
    }

    return () => {
      ativo = false;
      assinatura?.unsubscribe();
    };
  }, []);

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

    if (!rotaInicial) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: cores.fundo,
        }}
      >
        <ActivityIndicator size="large" color={cores.principal} />
      </View>
    );
  }

  return (
      <NavigationContainer ref={navegacaoRef} theme={temaNavegacao}>
      <StatusBar style={temaEscuro ? "light" : "dark"} />

      <Stack.Navigator
         initialRouteName={rotaInicial}
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