import React, {
  createContext,
  useState,
} from "react";

export const ThemeContext =
  createContext();

// Paleta original do app (fundo, texto, card, secundario, principal,
// favorito, comida) + tokens derivados usados pelo novo visual.
const CLARO = {
  fundo: "#FFFFFF",
  texto: "#1E1E1E",
  card: "#F8F8F8",
  secundario: "#666666",
  principal: "#FF6B00",
  favorito: "#1E1E1E",
  comida: "#FF8C00",

  // derivados
  escuro: false,
  borda: "#EDE8E3",
  principalSuave: "#FFF1E6",
  campo: "#FFF8F2",
  campoBorda: "#F3D9C4",
  sobrePrincipal: "#FFFFFF",
  sucesso: "#2E7D32",
  sucessoSuave: "#E8F5E9",
  alerta: "#FF9800",
  alertaTexto: "#9A5B00",
  alertaSuave: "#FFF4E0",
  erro: "#D32F2F",
  erroSuave: "#FDECEA",
};

const ESCURO = {
  fundo: "#121212",
  texto: "#FFFFFF",
  card: "#1E1E1E",
  secundario: "#BBBBBB",
  principal: "#FF6B00",
  favorito: "#FFFFFF",
  comida: "#FF6B00",

  // derivados
  escuro: true,
  borda: "#2E2E2E",
  principalSuave: "#33200F",
  campo: "#262626",
  campoBorda: "#3A3A3A",
  sobrePrincipal: "#FFFFFF",
  sucesso: "#66BB6A",
  sucessoSuave: "#1B2E1D",
  alerta: "#FF9800",
  alertaTexto: "#FFB74D",
  alertaSuave: "#33260F",
  erro: "#EF5350",
  erroSuave: "#3A1D1C",
};

export function ThemeProvider({
  children,
}) {
  const [temaEscuro, setTemaEscuro] =
    useState(false);

  const cores = temaEscuro
    ? ESCURO
    : CLARO;

  return (
    <ThemeContext.Provider
      value={{
        temaEscuro,
        setTemaEscuro,
        cores,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}