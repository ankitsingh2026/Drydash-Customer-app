import { useTheme } from "@/theme/useTheme";

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertType = 'success' | 'warning' | 'info' | 'error';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message?: string;
  primaryLabel?: string;     // e.g. "Delete", "Confirm"
  onPrimary?: () => void;
  onDismiss?: () => void;
  duration?: number;         // auto-dismiss ms (0 = no auto-dismiss)
}

// ─── Global imperative API ───────────────────────────────────────────────────

type ShowAlertFn = (config: AlertConfig) => void;
let _showAlert: ShowAlertFn | null = null;

const _activeAlertTitles = new Set<string>();

/** Call this anywhere — no context needed. */
export function showAlert(config: AlertConfig) {
  if (_activeAlertTitles.has(config.title)) return; // block duplicates
  if (_showAlert) _showAlert(config);
  else console.warn('[CustomAlert] <AlertProvider> not mounted.');
}

// ─── Variant config ───────────────────────────────────────────────────────────

interface VariantTokens {
  iconSymbol: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  primaryBg: string;
  primaryText: string;
}

function getVariantTokens(type: AlertType): VariantTokens {
  switch (type) {
    case 'success':
      return {
        iconSymbol: '✓',
        iconBg: '#DCFCE7',
        iconColor: '#16A34A',
        accentColor: '#16A34A',
        primaryBg: '#16A34A',
        primaryText: '#FFFFFF',
      };
    case 'warning':
      return {
        iconSymbol: '!',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        accentColor: '#D97706',
        primaryBg: '#D97706',
        primaryText: '#FFFFFF',
      };
    case 'info':
      return {
        iconSymbol: 'i',
        iconBg: '#DBEAFE',
        iconColor: '#2563EB',
        accentColor: '#2563EB',
        primaryBg: '#2563EB',
        primaryText: '#FFFFFF',
      };
    case 'error':
    default:
      return {
        iconSymbol: '✕',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        accentColor: '#DC2626',
        primaryBg: '#DC2626',
        primaryText: '#FFFFFF',
      };
  }
}

// ─── Toast Alert Card (non-actionable / auto-dismiss) ─────────────────────────

interface AlertCardProps extends AlertConfig {
  onClose: () => void;
}

function AlertCard({
  type,
  title,
  message,
  primaryLabel,
  onPrimary,
  onDismiss,
  onClose,
}: AlertCardProps) {
  const { isDark } = useTheme();
  const v = getVariantTokens(type);

  const slideY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    _activeAlertTitles.add(title);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();

    return () => { _activeAlertTitles.delete(title); };
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: -16, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.94, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onDismiss?.();
      onClose();
    });
  };

  const handlePrimary = () => {
    onPrimary?.();
    handleDismiss();
  };

  const cardBg = isDark ? '#1e2e1f' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          opacity,
          transform: [{ translateY: slideY }, { scale }],
        },
      ]}
    >
      {/* Left accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: v.accentColor }]} />

      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: v.iconBg }]}>
          <Text
            style={[
              styles.iconSymbol,
              { color: v.iconColor, fontStyle: type === 'info' ? 'italic' : 'normal' },
            ]}
          >
            {v.iconSymbol}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.textBlock}>
          <Text style={[styles.titleText, { color: textColor }]} numberOfLines={2}>
            {title}
          </Text>
          {message ? (
            <Text style={[styles.messageText, { color: subTextColor }]} numberOfLines={3}>
              {message}
            </Text>
          ) : null}

          {/* Action row */}
          {primaryLabel ? (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handlePrimary}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: v.primaryBg, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: v.primaryText }]}>
                  {primaryLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.dismissBtnText, { color: subTextColor }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Close button */}
        <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={12}>
          <Text style={[styles.closeBtnText, { color: subTextColor }]}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AlertState extends AlertConfig {
  id: number;
}

let _idCounter = 0;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  useEffect(() => {
    _showAlert = (config: AlertConfig) => {
      const id = ++_idCounter;
      setAlerts(prev => [...prev, { ...config, id }]);
      const isActionable = !!(config.primaryLabel || config.onPrimary);
      const autoDuration = config.duration ?? (
        isActionable ? 0 : (config.type === 'error' || config.type === 'warning' ? 3500 : 2500)
      );
      if (autoDuration > 0) {
        setTimeout(() => removeAlert(id), autoDuration);
      }
    };
    return () => { _showAlert = null; };
  }, []);

  const removeAlert = (id: number) =>
    setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <>
      {children}
      <View style={styles.overlay} pointerEvents="box-none">
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            {...alert}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </View>
    </>
  );
}

// ─── AlertOverlay — FIXED (no-op, kept for backward-compat imports) ───────────
// The double-alert bug was caused by AlertOverlay chaining onto _showAlert.
// Now it simply returns null — use ConfirmDialog for in-modal confirmations.
export function AlertOverlay() {
  return null;
}

// ─── ConfirmDialog — use this INSIDE Modals for destructive actions ───────────

export interface ConfirmDialogConfig {
  type?: AlertType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDialogProps {
  visible: boolean;
  config: ConfirmDialogConfig | null;
  onDismiss: () => void;
}

export function ConfirmDialog({ visible, config, onDismiss }: ConfirmDialogProps) {
  const { isDark, colors: theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!config) return null;

  const type = config.type ?? 'error';
  const v = getVariantTokens(type);

  // ── Theme-based colors ──────────────────────────────────────────────────────
  // In dark mode: card bg is the elevated dark surface (#102B25), not background
  const cardBg       = isDark ? theme.card : (theme.modalBackground ?? theme.card);
  const textColor    = theme.text;
  const subTextColor = theme.textSecondary;
  const dividerColor = theme.border;
  const overlayBg   = theme.backdrop;

  // Cancel button: transparent with border in dark (avoids blending with card bg),
  // teal-tinted inputBackground in light
  const cancelBg     = isDark ? 'transparent' : theme.inputBackground;
  const cancelBorderColor = isDark ? theme.lightborder : dividerColor;
  const cancelText   = theme.text;

  const handleConfirm = async () => {
    onDismiss();
    await config.onConfirm();
  };

  const handleCancel = () => {
    config.onCancel?.();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <Pressable style={[dialogStyles.backdrop, { backgroundColor: overlayBg }]} onPress={handleCancel}>
        <Animated.View
          style={[
            dialogStyles.dialog,
            {
              backgroundColor: cardBg,
              borderColor: dividerColor,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Stop event bubbling */}
          <Pressable onPress={(e) => e.stopPropagation()}>

            {/* Icon area */}
            <View style={dialogStyles.iconArea}>
              <View style={[dialogStyles.iconOuter, { backgroundColor: v.iconBg + '44' }]}>
                <View style={[dialogStyles.iconInner, { backgroundColor: v.iconBg }]}>
                  <Text style={[dialogStyles.iconText, { color: v.iconColor }]}>
                    {v.iconSymbol}
                  </Text>
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={[dialogStyles.title, { color: textColor }]}>{config.title}</Text>

            {/* Message */}
            {config.message ? (
              <Text style={[dialogStyles.message, { color: subTextColor }]}>{config.message}</Text>
            ) : null}

            {/* Divider */}
            <View style={[dialogStyles.divider, { backgroundColor: dividerColor }]} />

            {/* Buttons */}
            <View style={dialogStyles.btnRow}>
              {/* Cancel — uses theme inputBackground (teal-tinted neutral) */}
              <TouchableOpacity
                style={[dialogStyles.cancelBtn, { backgroundColor: cancelBg, borderColor: cancelBorderColor }]}
                onPress={handleCancel}
                activeOpacity={0.75}
              >
                <Text style={[dialogStyles.cancelBtnText, { color: cancelText }]}>
                  {config.cancelLabel ?? 'Cancel'}
                </Text>
              </TouchableOpacity>

              {/* Confirm — type accent color (red for error, green for success, etc.) */}
              <TouchableOpacity
                style={[dialogStyles.confirmBtn, { backgroundColor: v.primaryBg }]}
                onPress={handleConfirm}
                activeOpacity={0.82}
              >
                <Text style={[dialogStyles.confirmBtnText, { color: v.primaryText }]}>
                  {config.confirmLabel ?? 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
    gap: 10,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 14,
  },
  accentStrip: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  iconSymbol: {
    fontSize: 16,
    fontWeight: '800',
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  primaryBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    flexShrink: 0,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

const dialogStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  iconArea: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});