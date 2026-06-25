import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

const ShoeIcon = ({ size = 72 }: { size?: number }) => (
  <Image
    source={require("../assets/images/shoes.png")}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

const WashingMachineIcon = ({ size = 72 }: { size?: number }) => (
  <Image
    source={require("../assets/images/WashingMachine.png")}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

const DryShirtIcon = ({ size = 72 }: { size?: number }) => (
  <Image
    source={require("../assets/images/DryShirt.png")}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

const HangerIcon = ({ size = 72 }: { size?: number }) => (
  <Image
    source={require("../assets/images/Hanger.png")}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

const IronIcon = ({ size = 72 }: { size?: number }) => (
  <Image
    source={require("../assets/images/Iron.png")}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

const LOADER_ITEMS = [
  {
    id: 0,
    icon: ShoeIcon,
    text: "Picking up your sneakers…",
  },
  {
    id: 1,
    icon: WashingMachineIcon,
    text: "Starting the wash cycle…",
  },
  {
    id: 2,
    icon: DryShirtIcon,
    text: "Drying your clothes…",
  },
  {
    id: 3,
    icon: HangerIcon,
    text: "Folding & hanging up…",
  },
  {
    id: 4,
    icon: IronIcon,
    text: "Ironing to perfection…",
  },
];

export default function AppLoader({ onFinish }: { onFinish?: () => void }) {
  const { theme, isDark } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);

  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const Accent = theme.card;

  useEffect(() => {
    const animateIn = () => {
      translateY.setValue(80);
      opacity.setValue(0);
      scale.setValue(0.9);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    };

    animateIn();
  }, [currentIndex, isDark]);

  useEffect(() => {
    const ITEM_DURATION = 900;

    const t = setTimeout(() => {
      const last = currentIndex === LOADER_ITEMS.length - 1;

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -70,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (last) onFinish?.();
        setCurrentIndex((i) => (i + 1) % LOADER_ITEMS.length);
      });
    }, ITEM_DURATION);

    return () => clearTimeout(t);
  }, [currentIndex, onFinish]);

  const item = LOADER_ITEMS[currentIndex];
  const ActiveIcon = item.icon;

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        <ActiveIcon size={70} />
      </Animated.View>

      <View>
        <Text style={styles.mainText}>{item.text}</Text>
      </View>

      <View style={styles.brandRow}>
        <View style={styles.dot} />
        <Text style={styles.brandText}>DRYDASH</Text>
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

function makeStyles(theme: any) {
  const accent = theme.card;

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapper: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
    },
    mainText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 6,
      paddingHorizontal: 24,
    },
    brandRow: {
      position: "absolute",
      bottom: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: accent,
      opacity: 0.4,
    },
    brandText: {
      color: theme.card,
      fontSize: 10,
      letterSpacing: 3,
      fontWeight: "600",
    },
  });
}

