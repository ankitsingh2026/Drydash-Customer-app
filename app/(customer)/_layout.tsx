import { useAuthContext } from "@/context/AuthContext";
import { HomeDataProvider, useHomeData } from "@/context/HomeDataContext";
import PickupConfirmationModal from "@/components/PickupConfirmationModal";
import { Redirect, Stack, router } from "expo-router";
import { View, StyleSheet } from "react-native";
import React from "react";

/** Inner component so it can access HomeDataContext */
function CustomerLayoutInner() {
  const {
    bookingModalVisible,
    bookingModalConfirmed,
    bookingModalAddress,
    bookingModalSlot,
    bookingModalParams,
    hideBookingModal,
    setSkipNextFetch,
    setCachedData,
  } = useHomeData();

  return (
    <View style={styles.root}>
      {/* Navigation stack */}
      <Stack screenOptions={{ headerShown: false }} />

      {/*
        PickupConfirmationModal lives HERE — above the stack — so it
        persists across router.replace() calls. When the card slides
        up, the home screen is already loading underneath.
      */}
      <PickupConfirmationModal
        visible={bookingModalVisible}
        confirmed={bookingModalConfirmed}
        address={bookingModalAddress}
        slotLabel={bookingModalSlot}
        onNavigate={() => {
          // Called the instant exit animation begins — home loads while card is still moving
          setSkipNextFetch(true);
          setCachedData(null, "none");
          router.replace({
            pathname: "/(customer)/(tabs)/home",
            params: {
              orderPlaced: "1",
              justBooked: "1",
              bookingAddress: bookingModalAddress,
              bookingSlot: bookingModalSlot,
              ...bookingModalParams,
            },
          });
        }}
        onDismiss={() => {
          // Called after exit animation fully completes — just hide the overlay
          hideBookingModal();
        }}
      />
    </View>
  );
}

export default function CustomerLayout() {
  const { user, loading } = useAuthContext();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/auth" />;
  }

  return (
    <HomeDataProvider>
      <CustomerLayoutInner />
    </HomeDataProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
