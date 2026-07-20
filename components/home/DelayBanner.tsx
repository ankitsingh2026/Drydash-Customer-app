import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function DelayBanner({ delayInfo }: { delayInfo: any }) {
  const { theme } = useTheme();
  
  if (!delayInfo || !delayInfo.isDelay) return null;

  const getIconAndColor = () => {
    switch (delayInfo.category) {
      case 'WEATHER': return { icon: 'thunderstorm-outline', color: '#3B82F6', title: "Weather Alert" };
      case 'TRAFFIC': return { icon: 'car-outline', color: '#F59E0B', title: "Heavy Traffic" };
      case 'HIGH_VOLUME': return { icon: 'stats-chart-outline', color: '#EF4444', title: "High Volume" };
      case 'STAFF': return { icon: 'people-outline', color: '#EAB308', title: "Staff Shortage" };
      case 'VEHICLE': return { icon: 'bicycle-outline', color: '#F97316', title: "Vehicle Issues" };
      case 'TECHNICAL': return { icon: 'construct-outline', color: '#8B5CF6', title: "Technical Glitch" };
      case 'HOLIDAY': return { icon: 'calendar-outline', color: '#10B981', title: "Holiday Delays" };
      default: return { icon: 'alert-circle-outline', color: '#8B5CF6', title: "Service Delay" };
    }
  };

  const { icon, color, title } = getIconAndColor();

  return (
    <Animated.View 
      entering={FadeInUp.duration(500).springify()}
      style={[styles.container, { backgroundColor: color + '15', borderColor: color + '40' }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '25' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.reason, { color: theme.textSecondary }]}>
          {delayInfo.reason || "Expect slight delays in service due to unforeseen circumstances."}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
  },
});
