import { useCallback, useMemo, useRef } from "react";
import {
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type EffectKind = "coin" | "diamond" | "hit" | "levelup";

export interface ParticleEffect {
  id: string;
  kind: EffectKind;
  x: number;
  y: number;
}

export function useParticleSystem() {
  const shakeOffset = useSharedValue(0);
  const lastSpawnRef = useRef<Record<string, number>>({});

  const addParticleEffect = useCallback(
    (kind: EffectKind, _x: number, _y: number) => {
      const now = Date.now();
      const throttleMs = kind === "hit" ? 180 : 120;
      
      if (now - (lastSpawnRef.current[kind] || 0) < throttleMs) {
        return;
      }
      lastSpawnRef.current[kind] = now;

      if (kind === "hit") {
        shakeOffset.value = withSequence(
          withTiming(15, { duration: 40 }),
          withTiming(-12, { duration: 40 }),
          withTiming(8, { duration: 40 }),
          withTiming(-5, { duration: 40 }),
          withTiming(0, { duration: 60 })
        );
      }
    },
    [shakeOffset]
  );

  const cameraShakeTransform = useDerivedValue(() => {
    "worklet";
    const jx = shakeOffset.value * Math.cos(shakeOffset.value * 10);
    const jy = shakeOffset.value * Math.sin(shakeOffset.value * 8);
    return [
      { translateX: jx },
      { translateY: jy },
    ];
  });

  const renderParticles = useMemo(() => {
    return () => null;
  }, []);

  return {
    addParticleEffect,
    renderParticles,
    cameraShakeTransform,
  };
}
