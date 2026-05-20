// components/UPIPaymentSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Razorpay from 'react-native-customui';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { oldApiClient } from '@/lib/api/client';
import { DarkTheme } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UPIPaymentSelectorProps {
  razorpayOrderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  razorpayKeyId: string;
  themeColor: string;
  orderId: string;
  onSuccess: (data: any) => void;
  onFailure: (error: string) => void;
}

const SUPPORTED_UPI_APPS = [
  { package_name: 'com.google.android.apps.nbu.paisa.user', name: 'Google Pay' },
  { package_name: 'com.phonepe.app', name: 'PhonePe' },
  { package_name: 'net.one97.paytm', name: 'Paytm' },
  { package_name: 'in.amazon.mShop.android.shopping', name: 'Amazon Pay' },
];

const COD_OPTION = {
  id: 'cod',
  name: 'Cash on Delivery',
  isCod: true,
};

export const UPIPaymentSelector: React.FC<UPIPaymentSelectorProps> = ({
  razorpayOrderId,
  amount,
  customerEmail,
  customerPhone,
  customerName,
  razorpayKeyId,
  themeColor,
  orderId,
  onSuccess,
  onFailure,
}) => {
  const insets = useSafeAreaInsets();
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const detectApps = () => {
      try {
        if (Razorpay.getAppsWhichSupportUPI && typeof Razorpay.getAppsWhichSupportUPI === 'function') {
          Razorpay.getAppsWhichSupportUPI((result: any) => {
            let appsArray = result && result.data ? result.data : [];
            const filtered = appsArray
              .filter((app: any) =>
                SUPPORTED_UPI_APPS.some(s => s.package_name === (app.packageName || app.package_name))
              )
              .map((app: any) => ({
                id: app.packageName || app.package_name,
                package_name: app.packageName || app.package_name,
                name: app.appName || app.name,
                icon: app.iconBase64 ? { uri: app.iconBase64 } : null,
                isCod: false,
              }));

            if (filtered.length === 0) {
              setInstalledApps([]);
              setSelectedApp(COD_OPTION);
            } else {
              setInstalledApps(filtered);
              setSelectedApp(filtered[0]);
            }
          });
        } else {
          setInstalledApps([]);
          setSelectedApp(COD_OPTION);
        }
      } catch (error) {
        console.error('Error detecting UPI apps:', error);
        setInstalledApps([]);
        setSelectedApp(COD_OPTION);
      }
    };
    detectApps();
  }, []);

  const toggleExpand = () => {
    if (installedApps.length === 0 && selectedApp?.isCod) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const closeExpand = () => {
    if (expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);
    }
  };

  const selectApp = (app: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedApp(app);
    setExpanded(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedApp) {
      Alert.alert('No payment method', 'Please select a payment method.');
      return;
    }

    if (selectedApp.isCod) {
      setLoading(true);
      try {
        const response = await oldApiClient.post(`/v1/payments/${orderId}/mark-paid`, {
          paymentMode: 'cash',
          transactionId: `COD${Date.now()}`,
          notes: 'Cash on Delivery order',
        });
        if (response.data.success) {
          onSuccess({
            razorpay_payment_id: 'COD',
            razorpay_order_id: razorpayOrderId,
            razorpay_signature: 'COD',
          });
        } else {
          throw new Error(response.data.message || 'COD order failed');
        }
      } catch (error: any) {
        console.error('COD error:', error);
        onFailure(error.message || 'Failed to place COD order');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const options = {
      key_id: razorpayKeyId,
      amount: amount.toString(),
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'DryDash',
      email: customerEmail,
      contact: customerPhone,
      description: `Order ${razorpayOrderId}`,
      prefill: { name: customerName, email: customerEmail, contact: customerPhone },
      theme: { color: themeColor },
      method: 'upi',
      upi_app_package_name: selectedApp.package_name,
      '_[flow]': 'intent',
    };
    Razorpay.open(options)
      .then(onSuccess)
      .catch((error) => {
        if (error.code === 'PAYMENT_CANCELLED') onFailure('Payment cancelled');
        else onFailure(error.description || error.message || 'Payment failed');
      })
      .finally(() => setLoading(false));
  };

  const otherOptions = () => {
    const options = [...installedApps.filter(app => app.id !== selectedApp?.id)];
    if (!selectedApp?.isCod && !options.some(opt => opt.isCod)) {
      options.push(COD_OPTION);
    }
    return options;
  };

  const showExpandable = expanded && (installedApps.length > 0 || !selectedApp?.isCod);
  const hasOtherOptions = otherOptions().length > 0;

  return (
    <>
      {/* Blur overlay when expanded */}
      {expanded && hasOtherOptions && (
        <BlurView
          intensity={90}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeExpand}
          />
        </BlurView>
      )}

      <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]}>
        {/* Expandable list - rendered above the blur due to higher zIndex */}
        {showExpandable && hasOtherOptions && (
          <View style={styles.expandableListContainer}>
            <View style={styles.expandableList}>
              {otherOptions().map((opt, idx) => (
                <TouchableOpacity
                  key={opt.id || opt.package_name}
                  style={[
                    styles.otherOption,
                    idx !== otherOptions().length - 1 && styles.otherOptionBorder,
                  ]}
                  onPress={() => selectApp(opt)}
                >
                  {!opt.isCod && opt.icon && <Image source={opt.icon} style={styles.otherIcon} />}
                  {opt.isCod && <Ionicons name="cash-outline" size={24} color="#555" style={styles.otherIcon} />}
                  <Text style={styles.otherName}>{opt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.container}>
          <View style={styles.mainRow}>
            <TouchableOpacity
              style={styles.paymentSelectSection}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <View style={styles.paymentContent}>
                {!selectedApp?.isCod && selectedApp?.icon && (
                  <Image source={selectedApp.icon} style={styles.paymentIcon} />
                )}
                {selectedApp?.isCod && (
                  <Ionicons name="cash-outline" size={28} color="#555" style={styles.paymentIcon} />
                )}
                <View style={styles.paymentTextContainer}>
                  <View style={styles.paymentLabelRow}>
                    <Text style={styles.payLabel}>PAY USING</Text>
                    {(installedApps.length > 0 || !selectedApp?.isCod) && (
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#666"
                        style={styles.chevronIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.paymentName}>{selectedApp?.name || 'Select payment'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.placeOrderBtn,
                { backgroundColor: themeColor, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.placeOrderText}>Place Order</Text>
                  <Text style={styles.buttonAmount}>₹{(amount / 100).toFixed(2)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    position: 'relative',
    zIndex: 10,
  },
  container: {
    backgroundColor: DarkTheme.card,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentSelectSection: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    textAlign: 'center',
    lineHeight: 40,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  payLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
  },
  chevronIcon: {
    marginLeft: 6,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  placeOrderBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  placeOrderText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonAmount: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  expandableListContainer: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 8,
  },
  expandableList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  otherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  otherOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  otherIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  otherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  fallback: {
    padding: 40,
    alignItems: 'center',
  },
  fallbackText: {
    marginTop: 12,
    color: '#64748b',
  },
});