import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Skeleton } from "./Skeleton";

export const OrdersScreenSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.ordersHeader}>
        <View>
          <Skeleton variant="title" width={160} height={24} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={110} height={12} />
        </View>
        <Skeleton variant="circle" width={48} height={48} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            width={78}
            height={34}
            borderRadius={18}
            style={{ marginRight: 8 }}
          />
        ))}
      </View>

      {/* Order Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.orderCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.orderCardTop}>
            <Skeleton variant="badge" width={80} height={20} />
            <Skeleton variant="text" width={70} height={12} />
          </View>
          <View style={styles.orderCardDivider} />
          <View style={styles.orderCardBody}>
            <Skeleton variant="title" width="60%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton variant="text" width="40%" height={12} style={{ marginBottom: 10 }} />
            <Skeleton variant="button" width="100%" height={38} borderRadius={10} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ordersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  orderCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  orderCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: "transparent",
    marginVertical: 10,
  },
  orderCardBody: {},
});

export default OrdersScreenSkeleton;
