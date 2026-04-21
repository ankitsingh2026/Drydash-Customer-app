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

type ProductServicePopupProps = {
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    category: string;
    image: string;
    description?: string;
    process?: ProcessStep[];
    displayPrice?: string;
    unit?: string;
  } | null;
};

export default function ProductServicePopup({
  visible,
  onClose,
  product,
  onOpenCart,
}: ProductServicePopupProps) {
  const { theme } = useTheme();
  const cart = useCart();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
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
    ? `₹${product.price} ${product.displayPrice.replace(product.price.toString(), "").trim()}`
    : `₹${product.price}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Drag bar + close */}
              <View style={styles.header}>
                <View style={styles.dragIndicator} />
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={16} color="#eef3f2" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Product image card */}
              <View style={styles.imageContainer}>
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
                  <ShoppingBag size={16} color="#8AADA8" />
                </TouchableOpacity>

                <View style={styles.premiumBadge}>
                  <Star size={12} color="#4af4d5" fill="#56BFAB" />
                  <Text style={styles.premiumText}>
                    {product.category.toUpperCase()} SERVICE
                  </Text>
                </View>
              </View>

              {/* Content with ScrollView */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.content}>
                  <Text style={styles.productTitle}>{product.title}</Text>

                  {/* Price and Unit */}
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{priceDisplay}</Text>
                    {product.unit && (
                      <View style={styles.unitBadge}>
                        <Text style={styles.unitText}>per {product.unit}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.productDesc}>
                    {product.description ||
                      getDefaultDescription(product.category)}
                  </Text>

                  {/* Section label */}
                  <View style={styles.processLabelRow}>
                    <LinearGradient
                      colors={["#56BFAB", "#00614D"]}
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
                      colors={["#56BFAB", "#00A878", "#006B50"]}
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
                      <Minus size={15} color="#56BFAB" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity
                      onPress={handleIncrement}
                      style={styles.qtyBtn}
                    >
                      <Plus size={15} color="#56BFAB" strokeWidth={2.5} />
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
                  <FloatingCart onOpen={onOpenCart} />
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Helper functions for defaults
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
  return (
    <View style={styles.stepRow}>
      <LinearGradient
        colors={["#56BFAB", "#005B47"]}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0D1F1C",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 20,
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
    backgroundColor: "#2A4040",
    borderRadius: 2,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A2F2C",
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
    backgroundColor: "rgba(13,31,28,0.8)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(86,191,171,0.2)",
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
    backgroundColor: "rgba(86,191,171,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99, 239, 213, 0.35)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#55f1d4",
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#E8F5F2",
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
    color: "#56BFAB",
  },
  unitBadge: {
    backgroundColor: "rgba(86,191,171,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#56BFAB",
  },
  productDesc: {
    fontSize: 14,
    color: "#5E8A84",
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
    color: "#E8F5F2",
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
    shadowColor: "#005B47",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumText: {
    color: "#fff",
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
    color: "#D4EFEA",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12.5,
    color: "#4D7A74",
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: "#1E3D37",
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
    color: "#3E6E68",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 25,
    fontWeight: "800",
    color: "#E8F5F2",
    lineHeight: 36,
  },
  unitHint: {
    fontSize: 10,
    color: "#3E6E68",
    marginTop: 2,
  },
  addBtnWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#00A878",
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
    color: "#fff",
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
    borderColor: "rgba(86,191,171,0.3)",
    backgroundColor: "#152B27",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E8F5F2",
    minWidth: 32,
    textAlign: "center",
  },
});
