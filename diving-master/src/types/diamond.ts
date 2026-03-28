import type { FishSchoolGroupTransform } from "@/src/types/fish-school";
import type { CoinSparkle } from "@/src/types/coin";

export interface DiamondProps {
  rootTransform: FishSchoolGroupTransform;
  scale: number;
  sparkleBursts?: CoinSparkle[];
}
