import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PaymentStamp = ({ status = "paid" }) => {
  const isPaid = status?.toLowerCase() === "success";

  const color = isPaid ? "#16A34A" : "#DC2626"; // green / red

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: color,
          //   transform: [{ rotate: "-15deg" }],
        },
      ]}
    >
      <Text style={[styles.text, { color }]}>{isPaid ? "PAID" : "UNPAID"}</Text>
    </View>
  );
};

export default PaymentStamp;

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  text: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
