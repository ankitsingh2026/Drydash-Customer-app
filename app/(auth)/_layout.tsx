import { useAuthContext } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import { useTheme } from "@/theme/useTheme";

export default function AuthLayout() {
  const { user, loading } = useAuthContext();
  const { colors } = useTheme();

  if (loading) return null;

  if (user) {
    return <Redirect href="/(customer)/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    />
  );
}
