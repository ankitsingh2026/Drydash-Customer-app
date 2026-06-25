import React, { useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useTheme } from "@/context/ThemeContext";

interface RazorpayWebViewProps {
  amount: number;
  orderId: string;
  razorpayOrderId: string;
  razorpayKey: string;
  email: string;
  phone: string;
  name: string;
  themeColor: string;
  onSuccess: (data: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

type WebViewMessage =
  | {
      event: "payment_success";
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  | { event: "payment_failed"; error: string }
  | { event: "payment_cancelled" };

export default function RazorpayWebView({
  amount,
  orderId,
  razorpayOrderId,
  razorpayKey,
  email,
  phone,
  name,
  themeColor,
  onSuccess,
  onFailure,
  onCancel,
}: RazorpayWebViewProps) {
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
  
  const webViewRef = useRef<WebView>(null);

  console.log("Razorpay Key =>", razorpayKey);
  console.log("Order ID =>", razorpayOrderId);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

<style>
body{
  font-family:sans-serif;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  margin:0;
  background:#f5f5f5;
}

.loader{
  border:4px solid #f3f3f3;
  border-top:4px solid #3498db;
  border-radius:50%;
  width:40px;
  height:40px;
  animation:spin 1s linear infinite;
}

@keyframes spin{
  0%{transform:rotate(0deg);}
  100%{transform:rotate(360deg);}
}
</style>
</head>

<body>

<div class="loader"></div>

<script>
(function(){

console.log("Razorpay WebView Loaded");

var options = {
  key: "${razorpayKey}",
  amount: ${amount * 100}, // convert to paise
  currency: "INR",
  order_id: "${razorpayOrderId}",
  name: "DryDash",
  description: "Payment for Order #${orderId}",
  redirect: false,

  prefill:{
    email:"${email}",
    contact:"${phone}",
    name:"${name}"
  },

  theme:{
    color:"${themeColor}"
  },

  handler:function(response){
    window.ReactNativeWebView.postMessage(JSON.stringify({
      event:"payment_success",
      razorpay_payment_id:response.razorpay_payment_id,
      razorpay_order_id:response.razorpay_order_id,
      razorpay_signature:response.razorpay_signature
    }));
  },

  modal:{
    ondismiss:function(){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        event:"payment_cancelled"
      }));
    }
  }
};

var rzp = new Razorpay(options);

rzp.on("payment.failed",function(error){
  window.ReactNativeWebView.postMessage(JSON.stringify({
    event:"payment_failed",
    error: JSON.stringify(error)
  }));
});

setTimeout(function(){
  try {
    rzp.open();
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      event:"payment_failed",
      error:"Razorpay failed to open"
    }));
  }
},300);

})();
</script>

</body>
</html>
`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);

      console.log("Razorpay Response =>", data);

      switch (data.event) {
        case "payment_success":
          onSuccess({
            paymentId: data.razorpay_payment_id,
            orderId: data.razorpay_order_id,
            signature: data.razorpay_signature,
          });
          break;

        case "payment_failed":
          onFailure(data.error);
          break;

        case "payment_cancelled":
          onCancel();
          break;
      }
    } catch (err) {
      console.log("WebView parse error", err);
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
        onError={(e) => {
          console.log("WebView error:", e.nativeEvent);
        }}
        onHttpError={(e) => {
          console.log("HTTP error:", e.nativeEvent);
        }}
        onLoadEnd={() => {
          console.log("WebView Loaded Successfully");
        }}
      />
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.text,
  },
});