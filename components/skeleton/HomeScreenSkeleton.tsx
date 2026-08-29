import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Skeleton } from "./Skeleton";

export const HomeScreenSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <Skeleton variant="text" width={90} height={12} style={{ marginBottom: 6 }} />
        <Skeleton variant="title" width={220} height={22} />
      </View>

      {/* Hero Banner Section */}
      <View style={styles.heroSection}>
        <Skeleton width="100%" height={180} borderRadius={20} />
      </View>

      {/* Offer / Action Card */}
      <View style={styles.section}>
        <Skeleton width="100%" height={74} borderRadius={16} />
      </View>

      {/* Services Grid */}
      <View style={styles.section}>
        <Skeleton variant="text" width={130} height={16} style={{ marginBottom: 12 }} />
        <View style={styles.servicesRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.serviceBoxWrap}>
              <Skeleton width="100%" height={80} borderRadius={14} />
              <Skeleton variant="text" width="70%" height={10} style={{ marginTop: 6, alignSelf: "center" }} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.section}>
        <Skeleton variant="text" width={140} height={16} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={140} borderRadius={16} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={140} borderRadius={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSkeleton: {
    marginBottom: 18,
  },
  heroSection: {
    marginBottom: 18,
  },
  section: {
    marginBottom: 20,
  },
  servicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  serviceBoxWrap: {
    flex: 1,
    alignItems: "center",
  },
});

export default HomeScreenSkeleton;
