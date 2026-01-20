import { useAuthContext } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function CustomerLayout() {
  const { user, loading } = useAuthContext();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/auth" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
