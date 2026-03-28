import type { FishSchoolGroupTransform } from "@/src/types/fish-school";

export interface CoinSparkle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface CoinProps {
  rootTransform: FishSchoolGroupTransform;
  rotation: number;
  sparkleBursts?: CoinSparkle[];
}
