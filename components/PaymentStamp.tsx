import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

const PaymentStamp = ({ status = "paid" }) => {
  const { theme } = useTheme();
  const isPaid = status?.toLowerCase() === "success";
  const color = isPaid ? theme.primary : "#FF6B6B";

  return (
    <View style={[container, { borderColor: color + "50", backgroundColor: color + "12" }]}>
      <Text style={[text, { color }]}>
        {isPaid ? "PAID" : "UNPAID"}
      </Text>
    </View>
  );
};

export default PaymentStamp;

const container = {
  borderWidth: 1,
  paddingHorizontal: 7,
  paddingVertical: 3,
  borderRadius: 5,
  alignSelf: "center" as const,
};
const text = {
  fontSize: 9,
  fontWeight: "800" as const,
  letterSpacing: 2,
};
