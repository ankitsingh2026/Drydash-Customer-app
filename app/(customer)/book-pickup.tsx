import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookPickup() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.stackHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#34D399" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Book Pickup</Text>

          <View style={{ width: 26 }} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.kicker}>SCHEDULE SERVICE</Text>
          <Text style={styles.title}>Book Pickup</Text>
          <Text style={styles.subtitle}>
            We’ll collect your laundry at your preferred time.
          </Text>
        </View>

        {/* Pickup Summary Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar-outline" size={20} color="#34D399" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Pickup Schedule</Text>
              <Text style={styles.cardSub}>Today • 4:00 PM – 6:00 PM</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 18 }]}>
            <View style={styles.iconBox}>
              <Ionicons name="location-outline" size={20} color="#34D399" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Pickup Address</Text>
              <Text style={styles.cardSub}>Home Address (Saved)</Text>
            </View>
          </View>
        </View>

        {/* Info Icons */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={22} color="#34D399" />
            <Text style={styles.infoText}>On-time</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#34D399"
            />
            <Text style={styles.infoText}>Safe Care</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="leaf-outline" size={22} color="#34D399" />
            <Text style={styles.infoText}>Eco Friendly</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryText}>Confirm Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B1F1A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop:40,
  },

  /* Stack header */
  stackHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  header: {
    marginBottom: 32,
  },
  kicker: {
    color: "#34D399",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#112B24",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1F4038",
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(52,211,153,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  cardSub: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  infoItem: {
    alignItems: "center",
  },
  infoText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },

  bottom: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  primaryBtn: {
    backgroundColor: "#34D399",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  primaryText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  cancel: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 16,
    fontWeight: "600",
  },
});
