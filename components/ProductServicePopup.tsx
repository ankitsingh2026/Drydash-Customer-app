// components/ProductServicePopup.tsx

import { LinearGradient } from "expo-linear-gradient";
import { Minus, Plus, ShoppingBag, Star, X } from "lucide-react-native";
import React, { useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    PanResponder,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import FloatingCart from "./FloatingCart";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type ProcessStep = {
  step: number;
  heading: string;
  description: string;
};

import { Item } from "../constants/catalog";

type ProductServicePopupProps = {
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
  product: Item | null;
};

export default function ProductServicePopup({
  visible,
  onClose,
  product,
  onOpenCart,
}: ProductServicePopupProps) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
    const cart = useCart();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scrollY = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollEnabledRef = useRef(true);
  const isSwipingToClose = useRef(false);
  const touchStartY = useRef(0);
  const isClosing = useRef(false);

  const handleCloseAnimation = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onCloseRef.current();
      isClosing.current = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isDownwardDrag =
          gestureState.dy > 3 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        const isAtTop = scrollY.current <= 0;
        return isDownwardDrag && isAtTop;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const isDownwardDrag =
          gestureState.dy > 3 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        const isAtTop = scrollY.current <= 0;
        return isDownwardDrag && isAtTop;
      },
      onPanResponderGrant: () => {
        isSwipingToClose.current = true;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 30 || gestureState.vy > 0.3) {
          handleCloseAnimation();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 250,
          }).start();
        }
        isSwipingToClose.current = false;
      },
      onPanResponderTerminate: () => {
        isSwipingToClose.current = false;
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      isClosing.current = false;
      // Reset scroll position when opened
      scrollY.current = 0;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 250,
        mass: 0.9,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }).start();
    }
  }, [visible]);

  const qty = product ? cart.getQty(product.id) : 0;
  const cartTotalQty = cart.items.reduce((s, i) => s + i.qty, 0);

  const handleAddToCart = () => {
    if (product) {
      cart.addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        type: product.type,
      });
    }
  };

  const handleIncrement = () => {
    if (product) {
      cart.addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        type: product.type,
      });
    }
  };

  const handleDecrement = () => {
    if (product) cart.removeItem(product.id);
  };

  if (!product) return null;

  // Get the process steps from API or use default
  const processSteps = product.process || getDefaultProcess(product.category);

  // Format price display
  const priceDisplay = product.displayPrice
    ? product.displayPrice.trim().startsWith("₹")
      ? product.displayPrice.trim()
      : product.displayPrice.trim().startsWith("/")
        ? `₹${product.price}${product.displayPrice.trim()}`
        : `₹${product.displayPrice.trim()}`
    : `₹${product.price}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
         <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.dragIndicator} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color={theme.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
          onTouchStart={(e) => {
            touchStartY.current = e.nativeEvent.pageY;
          }}
          onTouchMove={(e) => {
            const currentY = e.nativeEvent.pageY;
            const diffY = currentY - touchStartY.current;
            if (diffY > 20 && scrollY.current <= 0) {
              handleCloseAnimation();
            }
          }}
        >
          {/* Drag bar + close */}

          {/* Product image card */}
          <View style={styles.imageContainer} {...panResponder.panHandlers}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
            />

            <LinearGradient
              colors={[
                "rgba(13,31,28,0.95)",
                "rgba(13,31,28,0.6)",
                "rgba(86,191,171,0.25)",
                "rgba(0,0,0,0)",
              ]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.imageGradient}
            />

            <TouchableOpacity style={styles.cartIconTop}>
              <ShoppingBag size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={styles.premiumBadge}>
              <Star size={12} color={theme.primary} fill={theme.primary} />
              <Text style={styles.premiumText}>
                {product.category.toUpperCase()} SERVICE
              </Text>
            </View>
          </View>

          {/* Content with ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={true}
            style={{ flexShrink: 1 }}
            contentContainerStyle={styles.scrollContent}
            onTouchStart={(e) => {
              touchStartY.current = e.nativeEvent.pageY;
            }}
            onTouchMove={(e) => {
              const currentY = e.nativeEvent.pageY;
              const diffY = currentY - touchStartY.current;
              if (diffY > 20 && scrollY.current <= 0) {
                handleCloseAnimation();
              }
            }}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              scrollY.current = y;
              if (y < -15) {
                handleCloseAnimation();
              }
            }}
            onScrollEndDrag={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              const velocityY = e.nativeEvent.velocity?.y ?? 0;
              if (y < -5 || (scrollY.current <= 0 && velocityY < -0.15)) {
                handleCloseAnimation();
              }
            }}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            bounces={true}
            overScrollMode="always"
          >
            <View style={styles.content}>
              <Text style={styles.productTitle}>{product.mainHeading}</Text>

              {/* Price and Unit */}
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{priceDisplay}</Text>
                {/* {product.unit && (
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>per {product.unit}</Text>
                  </View>
                )} */}
              </View>

              <Text style={styles.productDesc}>
                {product.description ||
                  getDefaultDescription(product.category)}
              </Text>

              {/* Section label */}
              <View style={styles.processLabelRow}>
                <LinearGradient
                  colors={[theme.primary, theme.primary]}
                  style={styles.processAccentBar}
                />
                <Text style={styles.processSectionTitle}>The Process</Text>
              </View>

              {/* Dynamic Steps from API */}
              <View style={styles.steps}>
                {processSteps.map((step, index) => (
                  <ProcessStep
                    key={step.step || index}
                    num={String(step.step || index + 1)}
                    title={step.heading}
                    description={step.description}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>TOTAL PRICE</Text>
              <Text style={styles.totalPrice}>
                ₹{product.price.toFixed(2)}
              </Text>
              {product.unit && (
                <Text style={styles.unitHint}>per {product.unit}</Text>
              )}
            </View>

            {qty === 0 ? (
              <TouchableOpacity
                onPress={handleAddToCart}
                style={styles.addBtnWrapper}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primary, theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addBtn}
                >
                  <Text style={styles.addBtnText}>Add to Bag →</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  onPress={() => cart.decreaseQty(product.id)}
                  style={styles.qtyBtn}
                >
                  <Minus size={15} color={theme.primary} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={styles.qtyBtn}
                >
                  <Plus size={15} color={theme.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {cartTotalQty > 0 && (
            <View
              style={{
                paddingTop: 5,
                paddingHorizontal: 20,
                marginBottom: 10,
              }}
            >
              {/* <FloatingCart onOpen={onOpenCart} /> */}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Helper functions for defaults (unchanged)
function getDefaultProcess(category: string): ProcessStep[] {
  const defaultProcesses: Record<string, ProcessStep[]> = {
    "Shoe Spa": [
      {
        step: 1,
        heading: "Inspection & Assessment",
        description:
          "Thorough inspection to identify material type, stains, and specific care requirements.",
      },
      {
        step: 2,
        heading: "Deep Cleaning",
        description:
          "Specialized cleaning using premium products suited to your shoe's material.",
      },
      {
        step: 3,
        heading: "Finishing & Protection",
        description:
          "Professional finishing with protective coating for lasting shine and durability.",
      },
    ],
    Laundry: [
      {
        step: 1,
        heading: "Sorting & Pre-Treatment",
        description:
          "Items are sorted by fabric type and color, with targeted stain treatment.",
      },
      {
        step: 2,
        heading: "Fabric-Safe Washing",
        description:
          "Cleaned using controlled cycles suited to the fabric type.",
      },
      {
        step: 3,
        heading: "Finishing & Quality Check",
        description:
          "Final inspection ensures premium quality before delivery.",
      },
    ],
    DryClean: [
      {
        step: 1,
        heading: "Inspection & Tagging",
        description:
          "Expert inspection of fabric type and condition before cleaning.",
      },
      {
        step: 2,
        heading: "Eco-Friendly Dry Cleaning",
        description:
          "Advanced solvent-based cleaning that's gentle on fabrics.",
      },
      {
        step: 3,
        heading: "Professional Pressing",
        description:
          "Expert pressing to restore the garment's original shape and finish.",
      },
    ],
  };

  return defaultProcesses[category] || defaultProcesses["Laundry"];
}

function getDefaultDescription(category: string): string {
  const descriptions: Record<string, string> = {
    "Shoe Spa":
      "Professional shoe cleaning and restoration service with premium care for all types of footwear.",
    Laundry:
      "Complete laundry service with careful handling, stain removal, and professional finishing.",
    DryClean:
      "Premium dry cleaning using eco-friendly solvents, perfect for delicate and formal wear.",
  };
  return (
    descriptions[category] ||
    "Professional care for your valuable items with premium quality service."
  );
}

function ProcessStep({
  num,
  title,
  description,
}: {
  num: string;
  title: string;
  description: string;
}) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
      return (
    <View style={styles.stepRow}>
      <LinearGradient
        colors={[theme.primary, theme.primary]}
        style={styles.stepNumCircle}
      >
        <Text style={styles.stepNumText}>{num}</Text>
      </LinearGradient>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
      </View>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.card,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: "hidden",
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    position: "relative",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -16 }],
  },
  imageContainer: {
    marginHorizontal: 20,
    borderRadius: 18,
    height: 220,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
    zIndex: 1,
  },
  cartIconTop: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  productImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  premiumBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    zIndex: 2,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textSecondary,
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.primary,
  },
  unitBadge: {
    backgroundColor: theme.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.primary,
  },
  productDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    marginBottom: 22,
  },
  processLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  processAccentBar: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  processSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
  },
  steps: {
    gap: 18,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  stepNumCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumText: {
    color: isDark ? "#001714" : "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  stepBody: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12.5,
    color: theme.textSecondary,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 25,
    fontWeight: "800",
    color: theme.text,
    lineHeight: 36,
  },
  unitHint: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  addBtnWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  addBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: isDark ? "#001714" : "#FFFFFF",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.card,
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    minWidth: 32,
    textAlign: "center",
  },
});