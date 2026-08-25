import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { ContentSection, ContentProcessStage } from "@/features/content/content.types";
import { SvgUri } from "react-native-svg";

interface StepItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_STEPS: StepItem[] = [
  {
    id: "book",
    title: "Book",
    subtitle: "Schedule a pickup in seconds",
    iconName: "phone-portrait-outline",
  },
  {
    id: "pickup",
    title: "Pickup",
    subtitle: "We collect from your door",
    iconName: "bicycle-outline",
  },
  {
    id: "wash",
    title: "Wash",
    subtitle: "Expert cleaning & premium care",
    iconName: "water-outline",
  },
  {
    id: "deliver",
    title: "Deliver",
    subtitle: "Fresh clothes back in 24h",
    iconName: "shirt-outline",
  },
];

const STEP_ICON_FALLBACKS: (keyof typeof Ionicons.glyphMap)[] = [
  "phone-portrait-outline",
  "bicycle-outline",
  "water-outline",
  "shirt-outline",
];

interface HowItWorksProps {
  sectionData?: ContentSection;
  processList?: ContentProcessStage[];
}

function StepMedia({ stage, color }: { stage: ContentProcessStage; color: string }) {
  const { theme } = useTheme();
  const mediaUrl = stage.mediaUrl?.trim() || "";
  const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");
  const isHttp = mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://");

  if (isHttp && isSvg) {
    return <SvgUri uri={mediaUrl} width={28} height={28} />;
  }
  if (isHttp) {
    return <Image source={{ uri: mediaUrl }} style={{ width: 28, height: 28 }} resizeMode="contain" />;
  }
  // Fallback to icon based on stepNumber
  const idx = ((stage.stepNumber ?? 1) - 1) % STEP_ICON_FALLBACKS.length;
  return <Ionicons name={STEP_ICON_FALLBACKS[idx]} size={24} color={color} />;
}

export default function HowItWorksSection({ sectionData, processList }: HowItWorksProps) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

  if (sectionData && sectionData.isActive === false) {
    return null;
  }

  const title = sectionData?.title?.trim() || "How it Works";

  // Use API processStages when available (sorted by stepNumber), else fall back to defaults
  const rawStages = (processList && processList.length > 0)
    ? processList
    : (sectionData?.processStages ?? []);

  const apiStages = rawStages.filter(
    (s) => s.stageName?.trim() || s.title?.trim()
  );
  const sortedApiStages = [...apiStages].sort(
    (a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0)
  );
  const useApiData = sortedApiStages.length > 0;

  return (
    <View style={styles.container}>
      {/* ── Section Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* ── Flow Container ── */}
      <View style={styles.flowWrapper}>
        {/* Background Connector Line (strictly behind the solid opaque circle cards) */}
        <View style={styles.connectingLine} />

        {/* Step Items */}
        <View style={styles.stepsRow}>
          {useApiData
            ? sortedApiStages.map((stage, idx) => (
                <View key={stage._id ?? idx} style={styles.stepItem}>
                  <View style={styles.iconCircleOuter}>
                    <View style={styles.iconCircleInner}>
                      <StepMedia stage={stage} color={theme.primary} />
                    </View>
                  </View>
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {stage.stageName || stage.title}
                  </Text>
                  {stage.description ? (
                    <Text style={styles.stepSubtitle} numberOfLines={2}>
                      {stage.description}
                    </Text>
                  ) : null}
                </View>
              ))
            : DEFAULT_STEPS.map((step) => (
                <View key={step.id} style={styles.stepItem}>
                  {/* Outer Circular Card (Solid opaque background to cover line completely) */}
                  <View style={styles.iconCircleOuter}>
                    {/* Inner Soft-Tinted Circle */}
                    <View style={styles.iconCircleInner}>
                      <Ionicons
                        name={step.iconName}
                        size={24}
                        color={theme.primary}
                      />
                    </View>
                  </View>

                  {/* Labels */}
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle} numberOfLines={2}>
                    {step.subtitle}
                  </Text>
                </View>
              ))}
        </View>
      </View>
    </View>
  );
}


const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 8,
    },
    header: {
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    flowWrapper: {
      position: "relative",
      paddingVertical: 2,
    },
    connectingLine: {
      position: "absolute",
      top: 28, // Perfectly centered at vertical midpoint of 56px outer circle
      left: "11%",
      right: "11%",
      height: 1.5,
      backgroundColor: isDark ? "rgba(184, 245, 168, 0.12)" : "#E2E8F0",
      zIndex: 0,
      elevation: 0,
    },
    stepsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      zIndex: 1,
    },
    stepItem: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 2,
    },
    iconCircleOuter: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? theme.card : "#FFFFFF", 
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(174, 247, 192, 0.3)" : "#E2E8F0",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      zIndex: 1,
      elevation: 1,
    },
    iconCircleInner: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(62, 82, 66, 0.15)" : "rgba(139, 92, 246, 0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    stepTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 3,
    },
    stepSubtitle: {
      fontSize: 10,
      fontWeight: "500",
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 13,
      paddingHorizontal: 2,
    },
  });
