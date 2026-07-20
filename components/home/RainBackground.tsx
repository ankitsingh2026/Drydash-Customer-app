import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const DROP_COUNT = 50;

const RainDrop = ({ index }: { index: number }) => {
  const startX = Math.random() * width;
  const duration = 700 + Math.random() * 500;
  const delay = Math.random() * 1500;
  const size = 10 + Math.random() * 10;
  const opacity = 0.3 + Math.random() * 0.4;

  const translateY = useSharedValue(-50);

  useEffect(() => {
    // Stagger starts
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(height + 100, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Fade out slightly towards the bottom
    const currentOpacity = opacity * (1 - (translateY.value / (height + 100)) * 0.5);
    return {
      transform: [{ translateY: translateY.value }, { rotate: '15deg' }],
      opacity: Math.max(0, currentOpacity),
    };
  });

  return (
    <Animated.View
      style={[
        styles.drop,
        { left: startX, height: size },
        animatedStyle
      ]}
    />
  );
};

export default function RainBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: DROP_COUNT }).map((_, i) => (
        <RainDrop key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0, 
    overflow: 'hidden',
    opacity: 0.8,
  },
  drop: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#05a3f8', 
    borderRadius: 2,
  }
});
