import { Alert as RNAlert, Platform } from "react-native";

// No navegador (Expo web) o Alert do react-native NÃO faz nada: nenhuma mensagem aparece.
// Este "Alert" tem a mesma assinatura e usa window.alert / window.confirm na web.
export const Alert = {
  alert(titulo, mensagem, botoes) {
    if (Platform.OS !== "web") {
      RNAlert.alert(titulo, mensagem, botoes);
      return;
    }

    const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
    const lista = Array.isArray(botoes) ? botoes : [];

    if (lista.length <= 1) {
      window.alert(texto);
      lista[0]?.onPress?.();
      return;
    }

    const cancelar = lista.find((b) => b.style === "cancel");
    const acao = lista.find((b) => b !== cancelar);
    if (window.confirm(texto)) acao?.onPress?.();
    else cancelar?.onPress?.();
  },
};

export function avisar(titulo, mensagem) {
  Alert.alert(titulo, mensagem);
}

export function confirmar(titulo, mensagem, textoConfirmar, aoConfirmar) {
  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    { text: textoConfirmar, style: "destructive", onPress: aoConfirmar },
  ]);
}