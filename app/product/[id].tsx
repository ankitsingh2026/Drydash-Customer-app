import { catalogData } from "@/constants/catalog";
import { useLocalSearchParams } from "expo-router";
import { Image, Text, View } from "react-native";

export default function ProductDetail() {
  const { id } = useLocalSearchParams();

  const allProducts = Object.values(catalogData).flat();

  const product = allProducts.find(p => p.id === id);

  if (!product) return null;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Image source={{ uri: product.image }} style={{ height: 200 }} />

      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        {product.title}
      </Text>

      <Text style={{ fontSize: 18 }}>₹{product.price}</Text>

      {/* Add your UI like screenshot */}
    </View>
  );
}