import { useAuthContext } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { user, loading } = useAuthContext();

  if (loading) return null;

  if (user) {
    return <Redirect href="/(customer)/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B1F1A" },
        animation: "fade",
      }}
    />
  );
}
