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
import RazorpayCustomUI from 'react-native-customui';
import RazorpayCheckout from 'react-native-razorpay';
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
  defaultCod?: boolean;
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
  name: 'Cash/UPI on Delivery',
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
  defaultCod,
  onSuccess,
  onFailure,
}) => {
  const insets = useSafeAreaInsets();
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCodConfirm, setShowCodConfirm] = useState(false);

  useEffect(() => {
    const detectApps = () => {
      try {
        if (RazorpayCustomUI.getAppsWhichSupportUPI && typeof RazorpayCustomUI.getAppsWhichSupportUPI === 'function') {
          RazorpayCustomUI.getAppsWhichSupportUPI((result: any) => {
            let appsArray = result?.data || [];
            if (appsArray.length === 0) {
              const fallback = SUPPORTED_UPI_APPS.map(app => ({
                id: app.package_name,
                package_name: app.package_name,
                name: app.name,
                icon: null,
                isCod: false,
              }));
              setInstalledApps(fallback);
              setSelectedApp(defaultCod ? COD_OPTION : fallback[0]);
              return;
            }
            const filtered = appsArray
              .filter((app: any) =>
                SUPPORTED_UPI_APPS.some(s => s.package_name === (app.packageName || app.package_name))
              )
              .map((app: any) => ({
                id: app.packageName || app.package_name,
                package_name: app.packageName || app.package_name,
                name: app.appName || app.name,
                icon: app.appLogo ? { uri: app.appLogo } : null,
                isCod: false,
              }));
            if (filtered.length === 0) {
              const fallback = SUPPORTED_UPI_APPS.map(app => ({
                id: app.package_name,
                package_name: app.package_name,
                name: app.name,
                icon: null,
                isCod: false,
              }));
              setInstalledApps(fallback);
              setSelectedApp(defaultCod ? COD_OPTION : fallback[0]);
            } else {
              setInstalledApps(filtered);
              setSelectedApp(defaultCod ? COD_OPTION : filtered[0]);
            }
          });
        } else {
          const fallback = SUPPORTED_UPI_APPS.map(app => ({
            id: app.package_name,
            package_name: app.package_name,
            name: app.name,
            icon: null,
            isCod: false,
          }));
          setInstalledApps(fallback);
          setSelectedApp(defaultCod ? COD_OPTION : fallback[0]);
        }
      } catch (error) {
        console.error('UPI detection error:', error);
        const fallback = SUPPORTED_UPI_APPS.map(app => ({
          id: app.package_name,
          package_name: app.package_name,
          name: app.name,
          icon: null,
          isCod: false,
        }));
        setInstalledApps(fallback);
        setSelectedApp(defaultCod ? COD_OPTION : fallback[0]);
      }
    };
    detectApps();
  }, [defaultCod]);

  const toggleExpand = () => {
    if (getAllOptions().length <= 1) return;
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

  const confirmCodAction = async () => {
    setShowCodConfirm(false);
    setLoading(true);
    try {
      const response = await oldApiClient.post(`/v1/payments/confirm-cod/${orderId}`);
      if (response.data.success) {
        // The backend only sets isCODConfirmed = true, no payment details are saved.
        onSuccess({
          razorpay_payment_id: 'COD',
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: 'COD',
        });
      } else {
        throw new Error(response.data.message || 'COD confirmation failed');
      }
    } catch (error: any) {
      console.error('COD error:', error);
      onFailure(error.message || 'Failed to confirm COD order');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedApp) {
      Alert.alert('No payment method', 'Please select a payment method.');
      return;
    }

    // ---------- Cash on Delivery (uses confirm-cod API, no payment object saved) ----------
    if (selectedApp.isCod) {
      setShowCodConfirm(true);
      return;
    }

    // ---------- UPI Intent (unchanged) ----------
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
    RazorpayCustomUI.open(options)
      .then(onSuccess)
      .catch((error: any) => {
        if (error.code === 'PAYMENT_CANCELLED') onFailure('Payment cancelled');
        else onFailure(error.description || error.message || 'Payment failed');
      })
      .finally(() => setLoading(false));
  };

  const getAllOptions = () => {
    const options = [...installedApps];
    if (!options.some(opt => opt.isCod)) {
      options.push(COD_OPTION);
    }
    return options;
  };

  const optionsList = getAllOptions();
  const canExpand = optionsList.length > 1;
  const showExpandable = expanded && canExpand;

  const renderPaymentIcon = (item: any, size: number = 40) => {
    const iconStyle = size === 40 ? styles.paymentIcon : styles.otherIcon;
    if (item.isCod) {
      return <Ionicons name="cash-outline" size={size} color="#555" style={iconStyle} />;
    }
    if (item.icon) {
      return <Image source={item.icon} style={iconStyle} onError={() => console.log('Icon error:', item.name)} />;
    }
    return <Ionicons name="phone-portrait-outline" size={size} color="#888" style={iconStyle} />;
  };

  if (!selectedApp) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator size="small" />
        <Text style={styles.fallbackText}>Loading payment options...</Text>
      </View>
    );
  }

  return (
    <>
      <Modal
        visible={showCodConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle-outline" size={28} color={themeColor} />
              <Text style={styles.modalTitle}>Delivery Time Update</Text>
            </View>
            <Text style={styles.modalText}>
              If you confirm Cash on Delivery (COD), your order will be delivered during the day time.
              {'\n\n'}
              If you make an online payment now, we can deliver your item early in the morning.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowCodConfirm(false)}
              >
                <Text style={styles.modalBtnCancelText}>Pay Online</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: themeColor }]}
                onPress={confirmCodAction}
              >
                <Text style={styles.modalBtnConfirmText}>Confirm COD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {expanded && canExpand && (
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeExpand} />
        </BlurView>
      )}

      <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]}>
        {showExpandable && (
          <View style={styles.expandableListContainer}>
            <View style={styles.expandableList}>
              {optionsList.map((opt, idx) => {
                const isSelected = opt.id === selectedApp?.id;
                return (
                  <TouchableOpacity
                    key={opt.id || opt.package_name}
                    style={[
                      styles.otherOption,
                      idx !== optionsList.length - 1 && styles.otherOptionBorder,
                      isSelected && styles.selectedOption
                    ]}
                    onPress={() => selectApp(opt)}
                  >
                    {renderPaymentIcon(opt, 32)}
                    <Text style={[styles.otherName, isSelected && styles.selectedName]}>{opt.name}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={themeColor} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
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
                {renderPaymentIcon(selectedApp, 40)}
                <View style={styles.paymentTextContainer}>
                  <View style={styles.paymentLabelRow}>
                    <Text style={styles.payLabel}>PAY USING</Text>
                    {canExpand && (
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#666"
                        style={styles.chevronIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.paymentName}>{selectedApp.name}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {!(selectedApp.isCod && defaultCod) && (
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
                    <Text style={styles.placeOrderText}>
                      {selectedApp.isCod ? 'Confirm' : 'Pay Now'}
                    </Text>
                    {!selectedApp.isCod && (
                      <Text style={styles.buttonAmount}>₹{(amount / 100).toFixed(2)}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginTop: 20, position: 'relative', zIndex: 10 },
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
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  paymentSelectSection: { flex: 1, justifyContent: 'center' },
  paymentContent: { flexDirection: 'row', alignItems: 'center' },
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
  paymentTextContainer: { flex: 1 },
  paymentLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  payLabel: { fontSize: 11, fontWeight: '600', color: '#888', letterSpacing: 0.5 },
  chevronIcon: { marginLeft: 6 },
  paymentName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  placeOrderBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  buttonContent: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  placeOrderText: { color: '#000', fontWeight: '700', fontSize: 14 },
  buttonAmount: { color: '#000', fontWeight: '800', fontSize: 16 },
  expandableListContainer: { position: 'relative', zIndex: 20, marginBottom: 8 },
  expandableList: { backgroundColor: '#f8f9fa', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e9ecef' },
  otherOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  otherOptionBorder: { borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  otherIcon: { width: 32, height: 32, marginRight: 12, resizeMode: 'contain' },
  otherName: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  selectedOption: { backgroundColor: '#f4f4f5' },
  selectedName: { color: '#000', fontWeight: '700' },
  checkIcon: { marginLeft: 8 },
  fallback: { padding: 40, alignItems: 'center' },
  fallbackText: { marginTop: 12, color: '#64748b' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: DarkTheme.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalBtnCancelText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnConfirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});