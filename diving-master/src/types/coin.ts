import type { FishSchoolGroupTransform } from "@/src/types/fish-school";
import type { SharedValue } from "react-native-reanimated";

export interface CoinSparkle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface CoinProps {
  rootTransform: FishSchoolGroupTransform;
  rotation: SharedValue<number> | number;
  sparkleBursts?: SharedValue<CoinSparkle[]> | CoinSparkle[];
}
