
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertType = 'success' | 'warning' | 'info' | 'error';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message?: string;
  primaryLabel?: string;     // e.g. "View location", "Try again"
  onPrimary?: () => void;
  onDismiss?: () => void;
  duration?: number;         // auto-dismiss ms (0 = no auto-dismiss)
}

// ─── Global imperative API ───────────────────────────────────────────────────

type ShowAlertFn = (config: AlertConfig) => void;
let _showAlert: ShowAlertFn | null = null;

/** Call this anywhere — no context needed. */
const _activeAlertTitles = new Set<string>();

export function showAlert(config: AlertConfig) {
  if (_activeAlertTitles.has(config.title)) return; // 👈 block duplicate
  if (_showAlert) _showAlert(config);
  else console.warn('[CustomAlert] <AlertProvider> not mounted.');
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const VARIANTS = {
  success: {
    card: '#021F1A',           // matches app bg
    iconBg: '#00E1A2',         // your primary
    iconColor: '#001714',      // deep bg on icon
    iconSymbol: '✓',
    primaryBg: '#0A3D30',
    primaryText: '#00E1A2',
    borderLeft: '#00E1A2',
  },
  warning: {
    card: '#1F1A02',
    iconBg: '#D4870A',
    iconColor: '#ffffff',
    iconSymbol: '!',
    primaryBg: '#2E2205',
    primaryText: '#F5A623',
    borderLeft: '#D4870A',
  },
  info: {
    card: '#071E1A',
    iconBg: '#1E3A34',         // your border color as bg
    iconColor: '#22EBAB',      // your subText
    iconSymbol: 'i',
    primaryBg: '#102B25',      // your card color
    primaryText: '#22EBAB',
    borderLeft: '#22EBAB',
  },
  error: {
    card: '#180808',
    iconBg: '#B71C1C',
    iconColor: '#FFB4B4',
    iconSymbol: '!',
    primaryBg: '#3D0000',
    primaryText: '#FF6B6B',
    borderLeft: '#FF3B30',
  },
} as const;

// ─── Single Alert Card ────────────────────────────────────────────────────────

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
  const v = VARIANTS[type];
  const slideY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    _activeAlertTitles.add(title);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    return () => { _activeAlertTitles.delete(title); };
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: -12, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onDismiss?.();
      onClose();
    });
  };

  const handlePrimary = () => {
    onPrimary?.();
    handleDismiss();
  };

  return (
    <Animated.View style={[styles.card, { backgroundColor: v.card, borderLeftColor: v.borderLeft, opacity, transform: [{ translateY: slideY }] }]}>
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: v.iconBg }]}>
          <Text style={[styles.iconSymbol, { color: v.iconColor, fontStyle: type === 'info' ? 'italic' : 'normal' }]}>
            {v.iconSymbol}
          </Text>
        </View>

        <Text style={styles.titleText} numberOfLines={3}>{title}</Text>

        <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={10}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* ── Optional message ── */}
      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        {primaryLabel ? (
          <Pressable
            onPress={handlePrimary}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: v.primaryBg, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.primaryBtnText, { color: v.primaryText }]}>{primaryLabel}</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={handleDismiss} style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={styles.dismissBtnText}>Dismiss</Text>
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
      const autoDuration = config.duration ?? (
        config.type === 'error' || config.type === 'warning' ? 3000 : 2000
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
// ADD this component at the bottom of CustomAlert.tsx, before the styles:
export function AlertOverlay() {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  useEffect(() => {
    const prev = _showAlert;
    // REPLACE the _showAlert inside AlertOverlay:
    _showAlert = (config: AlertConfig) => {
      prev?.(config);
      const id = ++_idCounter;
      setAlerts(p => [...p, { ...config, id }]);

      const autoDuration = config.duration ?? (
        config.type === 'error' || config.type === 'warning' ? 3000 : 0
      );
      if (autoDuration > 0) {
        setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), autoDuration);
      }
    };
    return () => { _showAlert = prev; };
  }, []);

  const remove = (id: number) => setAlerts(p => p.filter(a => a.id !== id));

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {alerts.map(alert => (
        <AlertCard key={alert.id} {...alert} onClose={() => remove(alert.id)} />
      ))}
    </View>
  );
}
// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',  
    alignItems: 'center',      
    zIndex: 9999,
    pointerEvents: 'box-none',
    gap: 8,
  },
  card: {
    width: '90%',            
    maxWidth: 400,             
    borderRadius: 16,
    borderLeftWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#00E1A2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#1E3A34',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconSymbol: {
    fontSize: 17,
    fontWeight: '800',
  },
  titleText: {
    flex: 1,
    color: '#DEE5FF',          // your theme.text
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  closeBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  messageText: {
    color: '#7FA99A',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 48,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  primaryBtn: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dismissBtnText: {
    color: '#4E7060',
    fontSize: 14,
    fontWeight: '600',
  },
});