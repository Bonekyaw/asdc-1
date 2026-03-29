import { Circle, Group, Path, Oval, Line, vec, RoundedRect } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import type { SwimmerProps } from "@/src/types/swimmer";

function Sparkle({ phase, angle }: { phase: SharedValue<number>; angle: number }) {
  const transform = useDerivedValue(() => {
    "worklet";
    return [
      { rotate: angle },
      { translateX: phase.value * 120 },
      { scale: Math.max(0, 1 - phase.value) * 1.5 },
    ];
  });
  return <Circle cx={0} cy={0} r={15} color="#FFD700" transform={transform} />;
}

export function Swimmer({
  rootTransform,
  armTransformLeft,
  armTransformRight,
  legTransformLeft,
  legTransformRight,
  hitFlashOpacity,
  collectSparklePhase,
}: SwimmerProps) {
  const SCALE = 0.35; // Tuned so length is roughly 80-90 pixels

  return (
    <Group transform={rootTransform}>
      <Group transform={[{ scale: SCALE }]}>
        {/* Shadow */}
        <Group transform={[{ translateY: 80 }]}>
          <Oval x={-180} y={-25} width={360} height={50} color="#003B46" opacity={0.2} />
        </Group>

        {/* Bubbles could go here, but background bubbles are already rendered */}
        
        {/* RIGHT LEG (Back) : origin is (-80, -15) */}
        <Group origin={{ x: -80, y: -15 }} transform={legTransformRight}>
           <Group transform={[{ translateX: -80 }, { translateY: -15 }]}>
             <Path path="M 0,0 C -30,5 -60,20 -90,10 C -120,0 -130,-10 -140,-5 C -135,5 -110,15 -90,25 C -50,30 -20,20 0,15 Z" color="#DFA283" style="fill" />
           </Group>
        </Group>

        {/* RIGHT ARM (Back) : origin is (60, -20) */}
        <Group origin={{ x: 60, y: -20 }} transform={armTransformRight}>
           <Group transform={[{ translateX: 60 }, { translateY: -20 }]}>
             <Path path="M 0,0 C -20,-30 -50,-50 -80,-40 C -110,-30 -120,-10 -130,0 C -110,-10 -90,-15 -70,-20 C -40,-25 -20,-10 0,10 Z" color="#DFA283" style="fill" />
           </Group>
        </Group>

        {/* BODY */}
        <Group>
          <Path path="M 80,-25 C 80,-25 -20,-35 -100,-25 C -120,-20 -120,20 -100,25 C -20,35 80,25 80,25 Z" color="#FFD6C0" style="fill" />
          <Path path="M 0,-32 C 0,-32 -40,-34 -100,-25 C -120,-20 -120,20 -100,25 C -40,34 0,32 0,32 Z" color="#2A9D8F" style="fill" />
          <Path path="M -30,-33 L -40,33 M -50,-33 L -60,33 M -70,-31 L -80,31" color="#E76F51" style="stroke" strokeWidth={4} strokeCap="round" opacity={0.8} />
        </Group>

        {/* LEFT LEG (Front) : origin is (-80, 15) */}
        <Group origin={{ x: -80, y: 15 }} transform={legTransformLeft}>
           <Group transform={[{ translateX: -80 }, { translateY: 15 }]}>
             <Path path="M 0,0 C -40,10 -80,-10 -110,10 C -130,25 -140,40 -150,50 C -130,50 -110,40 -90,30 C -60,20 -30,25 0,15 Z" color="#FFD6C0" style="fill" />
           </Group>
        </Group>

        {/* HEAD */}
        <Group transform={[{ translateX: 80 }]}>
           <Oval x={-10} y={-70} width={140} height={120} color="#FFD6C0" />
           <Path path="M 125,-10 C 135,-5 130,5 125,10 Z" color="#FFD6C0" />
           <Oval x={102} y={1} width={16} height={8} color="#E76F51" opacity={0.4} /> 
           <Path path="M -5,-15 C -5,-60 50,-80 90,-65 C 130,-50 135,-10 120,5 C 110,-20 60,-35 20,0 Z" color="#F4A261" />
           
           <Oval x={109} y={-35} width={12} height={20} color="#003B46" />
           <Circle cx={117} cy={-28} r={2} color="#FFFFFF" />
           
           <Oval x={82} y={-32} width={16} height={24} color="#003B46" />
           <Circle cx={93} cy={-24} r={3} color="#FFFFFF" />
           
           <Path path="M 95,15 Q 105,25 115,10" color="#D37965" style="stroke" strokeWidth={3} strokeCap="round" />
           <Path path="M 100,16 Q 105,25 110,14 Q 105,18 100,16 Z" color="#E76F51" />

           {/* Goggles */}
           <Path path="M 20,-10 C 40,-20 70,-25 80,-25" color="#264653" style="stroke" strokeWidth={4} />
           <Path path="M 115,-25 C 120,-25 130,-22 135,-15" color="#264653" style="stroke" strokeWidth={4} />
           
           <RoundedRect x={75} y={-35} width={25} height={25} r={10} color="#E0FBFC" opacity={0.6} />
           <RoundedRect x={75} y={-35} width={25} height={25} r={10} color="#2A9D8F" style="stroke" strokeWidth={3} />
           
           <RoundedRect x={105} y={-35} width={20} height={25} r={10} color="#E0FBFC" opacity={0.6} />
           <RoundedRect x={105} y={-35} width={20} height={25} r={10} color="#2A9D8F" style="stroke" strokeWidth={3} />
           
           <Line p1={vec(100, -23)} p2={vec(105, -23)} color="#2A9D8F" strokeWidth={3} />
        </Group>

        {/* LEFT ARM (Front) : origin is (60, 20) */}
        <Group origin={{ x: 60, y: 20 }} transform={armTransformLeft}>
           <Group transform={[{ translateX: 60 }, { translateY: 20 }]}>
             <Path path="M 0,0 C 20,40 50,60 80,45 C 110,30 130,5 140,-5 C 120,-10 90,10 60,20 C 30,30 10,15 0,-10 Z" color="#FFD6C0" style="fill" />
             <Path path="M 130,0 C 135,-5 145,-5 150,0 C 145,5 135,10 130,5 Z" color="#FFD6C0" style="fill" />
           </Group>
        </Group>

        {/* Caustics */}
        <Group>
           <Path path="M -50,-10 Q 0,10 50,-15" color="#FFFFFF" style="stroke" strokeWidth={2} strokeCap="round" opacity={0.4} />
           <Path path="M 10,15 Q 40,25 70,10" color="#FFFFFF" style="stroke" strokeWidth={2} strokeCap="round" opacity={0.3} />
           <Path path="M -80,-5 Q -60,10 -40,-5" color="#FFFFFF" style="stroke" strokeWidth={1.5} strokeCap="round" opacity={0.3} />
           <Circle cx={-10} cy={-5} r={3} color="#FFFFFF" opacity={0.6} />
           <Circle cx={-12} cy={-8} r={1.5} color="#FFFFFF" opacity={0.9} />
           <Circle cx={40} cy={5} r={4} color="#FFFFFF" opacity={0.5} />
           <Circle cx={38} cy={2} r={2} color="#FFFFFF" opacity={0.8} />
        </Group>

        {/* Hit Flash Overlay */}
        {hitFlashOpacity && (
          <Group opacity={hitFlashOpacity} blendMode="colorBurn">
            <Oval x={-140} y={-70} width={280} height={140} color="#ef4444" />
          </Group>
        )}

        {/* Collect Sparkles */}
        {collectSparklePhase && (
          <Group>
            <Sparkle phase={collectSparklePhase} angle={0} />
            <Sparkle phase={collectSparklePhase} angle={Math.PI * 0.4} />
            <Sparkle phase={collectSparklePhase} angle={Math.PI * 0.8} />
            <Sparkle phase={collectSparklePhase} angle={Math.PI * 1.2} />
            <Sparkle phase={collectSparklePhase} angle={Math.PI * 1.6} />
          </Group>
        )}
      </Group>
    </Group>
  );
}
