import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootState } from '../store';
import type { RootStackParamList } from '../navigation/types';
import { Butruname } from '../assets/svg';
import { FONTS } from '../constants/fonts';

const BG_COLOR = 'rgba(177, 43, 91, 1)';
const SPLASH_DURATION_MS = 5000;

// White variant of the Butru logo (the source path uses the brand pink #B92D5E)
const BUTRU_LOGO_WHITE = Butruname.replace('fill="#B92D5E"', 'fill="#FFFFFF"');

// Slice layout for the three-direction entrance ("bu" left, "t" top, "ru" right)
const LOGO_W = 160;
const LOGO_H = 66;
const BU_W = LOGO_W * 0.44;
const T_W = LOGO_W * 0.2;
const RU_W = LOGO_W * 0.36;

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const buX = useRef(new Animated.Value(-420)).current;
  const tY = useRef(new Animated.Value(-420)).current;
  const ruX = useRef(new Animated.Value(420)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(buX, {
        toValue: 0,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tY, {
        toValue: 0,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ruX, {
        toValue: 0,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 1100,
      delay: 700,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [buX, tY, ruX, taglineOpacity]);

  useEffect(() => {
    if (isHydrated) setHydrated(true);
  }, [isHydrated]);

  useEffect(() => {
    if (minTimeElapsed && hydrated) {
      navigation.replace(isLoggedIn ? 'Home' : 'Login');
    }
  }, [minTimeElapsed, hydrated, isLoggedIn, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBlock}>
        {/* Butru logo sliced into bu / t / ru, each sliding in from its side */}
        <View style={{ width: LOGO_W, height: LOGO_H, position: 'relative' }}>
          {/* bu — from the left */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: BU_W,
              height: LOGO_H,
              overflow: 'hidden',
              transform: [{ translateX: buX }],
            }}>
            <SvgXml xml={BUTRU_LOGO_WHITE} width={LOGO_W} height={LOGO_H} />
          </Animated.View>

          {/* t — from the top */}
          <Animated.View
            style={{
              position: 'absolute',
              left: BU_W,
              top: 0,
              width: T_W,
              height: LOGO_H,
              overflow: 'hidden',
              transform: [{ translateY: tY }],
            }}>
            <View style={{ marginLeft: -BU_W }}>
              <SvgXml xml={BUTRU_LOGO_WHITE} width={LOGO_W} height={LOGO_H} />
            </View>
          </Animated.View>

          {/* ru — from the right */}
          <Animated.View
            style={{
              position: 'absolute',
              left: BU_W + T_W,
              top: 0,
              width: RU_W,
              height: LOGO_H,
              overflow: 'hidden',
              transform: [{ translateX: ruX }],
            }}>
            <View style={{ marginLeft: -(BU_W + T_W) }}>
              <SvgXml xml={BUTRU_LOGO_WHITE} width={LOGO_W} height={LOGO_H} />
            </View>
          </Animated.View>
        </View>

       
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
  logoBlock: {
    alignItems: 'center',
  },
  tagline: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.arimoRegular,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;