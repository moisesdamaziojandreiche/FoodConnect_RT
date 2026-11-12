import { Alert, Platform } from "react-native";

export function avisar(titulo, mensagem) {
  if (Platform.OS === "web") {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }

  Alert.alert(titulo, mensagem);
}

export function confirmar(titulo, mensagem, textoConfirmar, aoConfirmar) {
  if (Platform.OS === "web") {
    if (window.confirm(mensagem ? `${titulo}\n\n${mensagem}` : titulo)) {
      aoConfirmar();
    }
    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    { text: textoConfirmar, style: "destructive", onPress: aoConfirmar },
  ]);
}
