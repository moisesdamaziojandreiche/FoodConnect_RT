// Tokens de design do app FoodConnect.
// As CORES ficam em src/context/ThemeContext.js (claro/escuro).

import { Platform } from "react-native";

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