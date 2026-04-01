import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PaymentStamp = ({ status = "paid" }) => {
  const isPaid = status?.toLowerCase() === "success";
  const color = isPaid ? "#00C896" : "#EF4444";

  return (
    <View style={[styles.container, { borderColor: color + "50", backgroundColor: color + "12" }]}>
      <Text style={[styles.text, { color }]}>
        {isPaid ? "PAID" : "UNPAID"}
      </Text>
    </View>
  );
};

export default PaymentStamp;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: "center",
  },
  text: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
