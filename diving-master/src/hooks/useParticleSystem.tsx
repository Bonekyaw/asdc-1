import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Group, Oval, Path, Skia, Circle } from "@shopify/react-native-skia";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

export type EffectKind = "coin" | "diamond" | "hit" | "levelup";

export interface ParticleEffect {
  id: string;
  kind: EffectKind;
  x: number;
  y: number;
}

function ConfettiColorGroup({
  items,
  progress,
  colorStr,
}: {
  items: any[];
  progress: SharedValue<number>;
  colorStr: string;
}) {
  const colorPath = useDerivedValue(() => {
    "worklet";
    const p = Skia.Path.Make();
    const prog = progress.value;
    const outPhase = Math.sqrt(prog);
    const gravityY = prog * prog * 300;
    const scale = Math.max(0, 1 - Math.pow(prog, 4));
    
    if (scale > 0.05) {
       for (let j = 0; j < items.length; j++) {
         const item = items[j];
         const dist = outPhase * item.speed * 250;
         const ox = Math.cos(item.angle) * dist;
         const oy = Math.sin(item.angle) * dist + gravityY;
         const spin = prog * 15;
         
         const rectPath = Skia.Path.Make();
         rectPath.addRect({ x: -6, y: -4, width: 12, height: 8 });
         
         const m = Skia.Matrix();
         m.translate(ox, oy);
         m.rotate(spin);
         m.scale(scale, scale);
         rectPath.transform(m);
         
         p.addPath(rectPath);
       }
    }
    return p;
  });

  return <Path path={colorPath} color={colorStr} />;
}

function EffectRenderer({
  effect,
  onComplete,
}: {
  effect: ParticleEffect;
  onComplete: (id: string) => void;
}) {
  const progress = useSharedValue(0);

  const confettiConfig = useMemo(() => {
    if (effect.kind !== "levelup") return [];
    return Array.from({ length: 30 }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.2,
      colorSet: Math.floor(Math.random() * 6),
    }));
  }, [effect.kind]);

  useEffect(() => {
    const durationMs =
      effect.kind === "diamond" ? 800 : effect.kind === "levelup" ? 2500 : 500;
    progress.value = withTiming(1, {
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => onComplete(effect.id), durationMs + 50);
    return () => clearTimeout(timer);
  }, [effect, progress, onComplete]);

  const x = effect.x;
  const y = effect.y;

  const combinedSparklePath = useDerivedValue(() => {
    "worklet";
    if (effect.kind !== "coin" && effect.kind !== "diamond") return Skia.Path.Make();
    
    const count = effect.kind === "coin" ? 6 : 8;
    const maxDist = effect.kind === "coin" ? 50 : 80;
    const baseRadius = effect.kind === "coin" ? 6 : 8;
    
    const p = Skia.Path.Make();
    const dist = progress.value * maxDist;
    const radius = Math.max(0, 1 - progress.value) * baseRadius;
    
    if (radius > 0.1) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const cx = Math.cos(angle) * dist;
        const cy = Math.sin(angle) * dist;
        p.addCircle(cx, cy, radius);
      }
    }
    return p;
  });

  const hitFlashTransform = useDerivedValue(() => {
    "worklet";
    return [{ scale: 1 + progress.value * 3 }];
  });

  const hitFlashOpacity = useDerivedValue(() => {
    "worklet";
    return Math.max(0, 0.8 - progress.value * 2);
  });

  if (effect.kind === "coin" || effect.kind === "diamond") {
    return (
      <Group transform={[{ translateX: x }, { translateY: y }]}>
        <Path path={combinedSparklePath} color={effect.kind === "coin" ? "#FFD700" : "#00FFFF"} />
      </Group>
    );
  }

  if (effect.kind === "hit") {
    return (
      <Group transform={[{ translateX: x }, { translateY: y }]}>
        <Group transform={hitFlashTransform} opacity={hitFlashOpacity}>
          <Oval x={-50} y={-50} width={100} height={100} color="#ff0000" />
        </Group>
      </Group>
    );
  }

  if (effect.kind === "levelup") {
    const colors = ["#FF3b30", "#34C759", "#007AFF", "#FFCC00", "#FF9500", "#AF52DE"];
    return (
      <Group transform={[{ translateX: x }, { translateY: y }]}>
        {colors.map((colorStr, colorIndex) => {
          const items = confettiConfig.filter((c) => c.colorSet === colorIndex);
          if (items.length === 0) return null;
          return (
            <ConfettiColorGroup
              key={colorIndex}
              items={items}
              progress={progress}
              colorStr={colorStr}
            />
          );
        })}
      </Group>
    );
  }

  return null;
}

export function useParticleSystem() {
  const [effects, setEffects] = useState<ParticleEffect[]>([]);
  const shakeOffset = useSharedValue(0);
  const lastSpawnRef = useRef<Record<string, number>>({});

  const addParticleEffect = useCallback(
    (kind: EffectKind, x: number, y: number) => {
      const now = Date.now();
      const throttleMs = kind === "hit" ? 200 : kind === "levelup" ? 1000 : 80;
      
      if (now - (lastSpawnRef.current[kind] || 0) < throttleMs) {
        return;
      }
      lastSpawnRef.current[kind] = now;

      const id = Math.random().toString(36).substring(2, 11);
      
      setEffects((prev) => {
        if (prev.length >= 8) {
          return [...prev.slice(1), { id, kind, x, y }];
        }
        return [...prev, { id, kind, x, y }];
      });

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

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const cameraShakeTransform = useDerivedValue(() => {
    "worklet";
    const jx = shakeOffset.value * Math.cos(shakeOffset.value * 10);
    const jy = shakeOffset.value * Math.sin(shakeOffset.value * 8);
    return [
      { translateX: jx },
      { translateY: jy },
    ];
  });

  const renderParticles = useCallback(() => {
    return (
      <Group>
        {effects.map((fx) => (
          <EffectRenderer key={fx.id} effect={fx} onComplete={removeEffect} />
        ))}
      </Group>
    );
  }, [effects, removeEffect]);

  return {
    addParticleEffect,
    renderParticles,
    cameraShakeTransform,
  };
}
