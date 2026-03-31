import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const ShoeIcon = ({ size = 72 }) => (
  <Image source={require('../assets/images/shoes.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const HangerIcon = ({ size = 72 }) => (
  <Image source={require('../assets/images/Hanger.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const IronIcon = ({ size = 72 }) => (
  <Image source={require('../assets/images/Iron.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const DryShirtIcon = ({ size = 72 }) => (
  <Image source={require('../assets/images/DryShirt.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const WashingMachineIcon = ({ size = 72 }) => (
  <Image source={require('../assets/images/WashingMachine.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const LOADER_ITEMS = [
  { id: 0, icon: ShoeIcon,           text: 'Picking up your sneakers…',  subtext: 'Expert shoe cleaning service'       },
  { id: 1, icon: WashingMachineIcon, text: 'Starting the wash cycle…',   subtext: 'Premium laundry, handled with care' },
  { id: 2, icon: DryShirtIcon,       text: 'Drying your clothes…',       subtext: 'Fresh & fluffy, every time'         },
  { id: 3, icon: HangerIcon,         text: 'Folding & hanging up…',      subtext: 'Wrinkle-free and wardrobe-ready'    },
  { id: 4, icon: IronIcon,           text: 'Ironing to perfection…',     subtext: 'Crisp and clean, just for you'      },
];

const BG_COLOR   = '#0A1628';
const ACCENT     = '#22EBAB';
const RING_R     = 110; // radius of the orbiting icon ring
const TOTAL      = LOADER_ITEMS.length;

// ── Circular Ring ─────────────────────────────────────────────────────────────
// Each icon sits at a fixed angle slot; the whole ring rotates continuously.
const CircularRing = ({
  activeIndex,
  rotation,
}: {
  activeIndex: number;
  rotation: Animated.Value;
}) => {
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.ringContainer, { transform: [{ rotate: spin }] }]}>
      {LOADER_ITEMS.map((item, i) => {
        const angle = (2 * Math.PI * i) / TOTAL - Math.PI / 2; // start from top
        const x = RING_R * Math.cos(angle);
        const y = RING_R * Math.sin(angle);
        const isActive = i === activeIndex;
        const IconComponent = item.icon;

        // Counter-rotate each icon so it stays upright as the ring spins
        const counterSpin = rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-360deg'],
        });

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.orbitIcon,
              {
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { rotate: counterSpin },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.orbitIconBg,
                {
                  backgroundColor: isActive
                    ? 'rgba(34,235,171,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  borderColor: isActive
                    ? 'rgba(34,235,171,0.5)'
                    : 'rgba(255,255,255,0.08)',
                  width: isActive ? 52 : 42,
                  height: isActive ? 52 : 42,
                  borderRadius: isActive ? 16 : 13,
                },
              ]}
            >
              <IconComponent size={isActive ? 30 : 22} />
            </View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

// ── Main Loader ───────────────────────────────────────────────────────────────
export const AppLoader = ({ onFinish }: { onFinish?: () => void }) => {
  const ITEM_DURATION  = 1400;
  const FADE_DURATION  = 220;
  const ROTATION_SPEED = 3000; // ms per full rotation

  const [currentIndex, setCurrentIndex] = useState(0);

  const rotation       = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const centerScale    = useRef(new Animated.Value(0.8)).current;
  const centerOpacity  = useRef(new Animated.Value(0)).current;

  // ── Continuous ring rotation ──────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: ROTATION_SPEED,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ── Text + center icon animate in ────────────────────────────────────────
  const animateIn = () => {
    textOpacity.setValue(0);
    textTranslateY.setValue(10);
    centerScale.setValue(0.75);
    centerOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(centerScale, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(centerOpacity, {
        toValue: 1,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: FADE_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  const animateOut = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(centerOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(centerScale, {
        toValue: 1.1,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: -8,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => cb());
  };

  useEffect(() => {
    animateIn();

    const timer = setTimeout(() => {
      animateOut(() => {
        const next = (currentIndex + 1) % LOADER_ITEMS.length;
        // call onFinish after one full loop
        if (currentIndex === LOADER_ITEMS.length - 1) {
          onFinish?.();
        }
        setCurrentIndex(next);
      });
    }, ITEM_DURATION);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const item = LOADER_ITEMS[currentIndex];
  const ActiveIcon = item.icon;

  return (
    <View style={styles.container}>
      {/* Ambient rings */}
      <View style={styles.ambientRing1} />
      <View style={styles.ambientRing2} />

      {/* Orbiting icon ring */}
      <CircularRing activeIndex={currentIndex} rotation={rotation} />

      {/* Center: active icon shown large */}
      <Animated.View
        style={[
          styles.centerIconWrapper,
          {
            opacity: centerOpacity,
            transform: [{ scale: centerScale }],
          },
        ]}
      >
        <View style={styles.centerIconBg}>
          <ActiveIcon size={64} />
        </View>
      </Animated.View>

      {/* Text below the ring */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
        ]}
      >
        <Text style={styles.mainText}>{item.text}</Text>
        <Text style={styles.subText}>{item.subtext}</Text>
      </Animated.View>

      {/* Brand */}
      <View style={styles.brandRow}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>CLEANSTEP</Text>
        <View style={styles.brandDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ambient decorative rings (static)
  ambientRing1: {
    position: 'absolute',
    width: RING_R * 2 + 80,
    height: RING_R * 2 + 80,
    borderRadius: RING_R + 40,
    borderWidth: 1,
    borderColor: 'rgba(34,235,171,0.06)',
  },
  ambientRing2: {
    position: 'absolute',
    width: RING_R * 2 + 130,
    height: RING_R * 2 + 130,
    borderRadius: RING_R + 65,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(34,235,171,0.04)',
  },
  // The spinning ring that holds all orbit icons
  ringContainer: {
    width: RING_R * 2,
    height: RING_R * 2,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitIconBg: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // Center large icon
  centerIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconBg: {
    width: 136,
    height: 136,
    borderRadius: 40,
    backgroundColor: 'rgba(34,235,171,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,235,171,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 36,
  },
  mainText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 7,
  },
  subText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.15,
  },
  brandRow: {
    position: 'absolute',
    bottom: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    opacity: 0.35,
  },
  brandText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
  },
});

export default AppLoader;