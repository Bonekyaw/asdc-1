import type { FishSchoolGroupTransform } from "@/src/types/fish-school";
import type { CoinSparkle } from "@/src/types/coin";
import type { SharedValue } from "react-native-reanimated";

export interface DiamondProps {
  rootTransform: FishSchoolGroupTransform;
  scale: SharedValue<number> | number;
  sparkleBursts?: SharedValue<CoinSparkle[]> | CoinSparkle[];
}
