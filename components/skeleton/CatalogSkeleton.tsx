import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { Skeleton } from "./Skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_H_PAD = 16;
const CARD_W = (SCREEN_WIDTH - GRID_H_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

interface CatalogSkeletonProps {
  count?: number;
  showNotice?: boolean;
}

export const CatalogSkeletonCard: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Product Image Skeleton */}
      <View style={styles.cardImageWrap}>
        <Skeleton width="100%" height="100%" borderRadius={0} />
      </View>

      {/* Product Info Skeleton */}
      <View style={styles.cardBody}>
        <Skeleton variant="text" width="85%" height={11} style={{ marginBottom: 4 }} />
        <Skeleton variant="text" width="55%" height={11} style={{ marginBottom: 8 }} />
        <Skeleton variant="badge" width="60%" height={14} borderRadius={4} />
      </View>

      {/* Add Button Skeleton */}
      <View style={styles.cardFooter}>
        <Skeleton width="100%" height={28} borderRadius={6} />
      </View>
    </View>
  );
};

export const CatalogSkeleton: React.FC<CatalogSkeletonProps> = ({
  count = 9,
  showNotice = false,
}) => {
  const { theme } = useTheme();
  const skeletonArray = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Optional Notice Skeleton (e.g. Laundry 5kg note) */}
      {showNotice && (
        <View
          style={[
            styles.noticeSkeleton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Skeleton variant="circle" width={20} height={20} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Skeleton variant="text" width="90%" height={10} style={{ marginBottom: 4 }} />
            <Skeleton variant="text" width="60%" height={10} />
          </View>
        </View>
      )}

      {/* 3-Column Grid */}
      <View style={styles.grid}>
        {skeletonArray.map((key) => (
          <CatalogSkeletonCard key={key} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 24,
  },
  noticeSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  card: {
    width: CARD_W,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    marginBottom: 2,
  },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  cardBody: {
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 6,
  },
  cardFooter: {
    paddingHorizontal: 7,
    paddingBottom: 8,
  },
});

export default CatalogSkeleton;
