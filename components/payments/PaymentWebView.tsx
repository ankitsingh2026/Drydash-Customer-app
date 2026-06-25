// app/orders/PaymentWebView.tsx
// import { Audio } from "expo-av";
import { Props } from "@/features/payment/payment.types";
import React, { useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
// import { socket } from "../../services/socket"; // adjust if path differs
import { useTheme } from "../../context/ThemeContext";

const PaymentWebView: React.FC<Props> = ({
  paymentData,
  orderId,
  onSuccess,
  onFailure,
}) => {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const webviewRef = useRef<any>(null);

  //   useEffect(() => {
  //     // join room for real-time updates
  //     if (!orderId) return;
  //     socket.emit("joinOrderRoom", orderId);

  //     socket.on("paymentSuccess", (data: any) => {
  //       if (data.orderId === orderId || data.txnid === paymentData.txnid) {
  //         playSuccessSound();
  //         onSuccess(data);
  //       }
  //     });

  //     socket.on("paymentFailed", (data: any) => {
  //       if (data.orderId === orderId || data.txnid === paymentData.txnid) {
  //         Alert.alert("Payment failed");
  //         onFailure?.(data);
  //       }
  //     });

  //     return () => {
  //       socket.off("paymentSuccess");
  //       socket.off("paymentFailed");
  //     };
  //   }, [orderId]);

  //   const playSuccessSound = async () => {
  //     try {
  //       const { sound } = await Audio.Sound.createAsync(
  //         require("../../assets/success.mp3"),
  //       );
  //       await sound.playAsync();
  //     } catch (e) {
  //       // optional: if sound missing just ignore
  //       // console.log("sound play error", e);
  //     }
  //   };

  console.log("this is the payment Data inside", paymentData, orderId);

  const payuUrl = "https://test.payu.in/_payment";

  // build HTML auto-submit form
  const html = `
  <html>
    <body onload="document.forms[0].submit()">
      <form id="payuForm" action="${payuUrl}" method="post">
        <input type="hidden" name="key" value="${paymentData.key}" />
        <input type="hidden" name="txnid" value="${paymentData.txnid}" />
        <input type="hidden" name="amount" value="${paymentData.amount}" />
        <input type="hidden" name="productinfo" value="${paymentData.productinfo ?? "Laundry"}" />
        <input type="hidden" name="firstname" value="${paymentData.firstname ?? "Customer"}" />
        <input type="hidden" name="email" value="${paymentData.email ?? "test@example.com"}" />
        <input type="hidden" name="phone" value="${paymentData.phone ?? "9999999999"}" />
        <input type="hidden" name="surl" value="${paymentData.surl ?? ""}" />
        <input type="hidden" name="furl" value="${paymentData.furl ?? ""}" />
        <input type="hidden" name="hash" value="${paymentData.hash}" />
      </form>
      <p>Redirecting to payment...</p>
    </body>
  </html>`;

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onNavigationStateChange={(nav) => {
          // optional: you can inspect nav.url for surl/furl but DO NOT rely on it for final confirmation
          // final confirmation must come from webhook -> socket
        }}
      />
    </View>
  );
};

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default PaymentWebView;
