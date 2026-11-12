import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Campo } from "./UI";
import {
  mascararCep,
  mascararNumeroCartao,
  mascararTelefone,
  mascararValidade,
  soDigitos,
} from "../lib/cartaoUtils";
import { espaco, fonte } from "../theme/tema";

// Campos do cartão. O estado fica na tela que usa o componente (valores / setValores),
// que valida com validarCartao() e envia com salvarCartao().
export default function CartaoForm({ valores, setValores, cores }) {
  const campo = (chave, mascara) => (texto) =>
    setValores((v) => ({ ...v, [chave]: mascara ? mascara(texto) : texto }));

  return (
    <View>
      <Campo
        cores={cores}
        icone="card-outline"
        placeholder="Número do cartão"
        keyboardType="number-pad"
        autoComplete="cc-number"
        maxLength={23}
        value={valores.numero}
        onChangeText={campo("numero", mascararNumeroCartao)}
      />

      <Campo
        cores={cores}
        icone="person-outline"
        placeholder="Nome impresso no cartão"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="name"
        maxLength={60}
        value={valores.nome}
        onChangeText={campo("nome")}
      />

      <View style={styles.linha}>
        <Campo
          cores={cores}
          containerStyle={styles.metade}
          icone="calendar-outline"
          placeholder="Validade (MM/AA)"
          keyboardType="number-pad"
          autoComplete="cc-exp"
          maxLength={5}
          value={valores.validade}
          onChangeText={campo("validade", mascararValidade)}
        />

        <Campo
          cores={cores}
          containerStyle={styles.metade}
          icone="lock-closed-outline"
          placeholder="CVV"
          keyboardType="number-pad"
          autoComplete="cc-csc"
          secureTextEntry
          maxLength={4}
          value={valores.cvv}
          onChangeText={(t) => setValores((v) => ({ ...v, cvv: soDigitos(t) }))}
        />
      </View>

      <Text style={[styles.secao, { color: cores.texto }]}>
        Endereço de cobrança do cartão
      </Text>

      <View style={styles.linha}>
        <Campo
          cores={cores}
          containerStyle={styles.metade}
          icone="location-outline"
          placeholder="CEP"
          keyboardType="number-pad"
          autoComplete="postal-code"
          maxLength={9}
          value={valores.cep}
          onChangeText={campo("cep", mascararCep)}
        />

        <Campo
          cores={cores}
          containerStyle={styles.metade}
          placeholder="Número"
          maxLength={10}
          value={valores.numeroEndereco}
          onChangeText={campo("numeroEndereco")}
        />
      </View>

      <Campo
        cores={cores}
        placeholder="Complemento (opcional)"
        maxLength={40}
        value={valores.complemento}
        onChangeText={campo("complemento")}
      />

      <Campo
        cores={cores}
        icone="call-outline"
        placeholder="Telefone com DDD"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={15}
        value={valores.telefone}
        onChangeText={campo("telefone", mascararTelefone)}
      />

      <View style={[styles.aviso, { backgroundColor: cores.principalSuave }]}>
        <Text style={[styles.avisoTexto, { color: cores.secundario }]}>
          Não guardamos o número nem o CVV do cartão. Salvamos apenas um código
          seguro (token), os 4 últimos dígitos e a bandeira.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    gap: espaco.md,
  },

  metade: {
    flex: 1,
  },

  secao: {
    marginTop: espaco.sm,
    marginBottom: espaco.md,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },

  aviso: {
    marginTop: espaco.xs,
    padding: espaco.md,
    borderRadius: 12,
  },

  avisoTexto: {
    fontSize: 12,
    lineHeight: 17,
  },
});