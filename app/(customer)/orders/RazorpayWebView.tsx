// RazorpayWebView.tsx
import React, { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface RazorpayWebViewProps {
  amount: number;
  orderId: string;
  email: string;
  phone: string;
  name: string;
  themeColor: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

type WebViewMessage =
  | { event: 'payment_success'; razorpay_payment_id: string }
  | { event: 'payment_failed'; error: string }
  | { event: 'payment_cancelled' };

export default function RazorpayWebView({
  amount,
  orderId,
  email,
  phone,
  name,
  themeColor,
  onSuccess,
  onFailure,
  onCancel,
}: RazorpayWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <script>
          (function() {
            const options = {
              key: "rzp_test_SQIhnBg0tOLH7I",
              amount: "${Math.round(amount * 100)}",
              currency: "INR",
              name: "DryDash",
              description: "Payment for Order #${orderId}",
              prefill: {
                email: "${email}",
                contact: "${phone}",
                name: "${name}"
              },
              theme: { color: "${themeColor}" },
              handler: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'payment_success',
                  razorpay_payment_id: response.razorpay_payment_id
                }));
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    event: 'payment_cancelled'
                  }));
                }
              }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'payment_failed',
                error: error.error.description || 'Payment failed'
              }));
            });

            setTimeout(() => rzp.open(), 500);
          })();
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      switch (data.event) {
        case 'payment_success':
          onSuccess(data.razorpay_payment_id);
          break;
        case 'payment_failed':
          onFailure(data.error);
          break;
        case 'payment_cancelled':
          onCancel();
          break;
      }
    } catch (err) {
      console.error('Failed to parse message', err);
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});