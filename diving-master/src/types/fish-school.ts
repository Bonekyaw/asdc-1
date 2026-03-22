import type { Group } from "@shopify/react-native-skia";
import type { ComponentProps } from "react";

export type FishSchoolGroupTransform = NonNullable<
  ComponentProps<typeof Group>["transform"]
>;

export type FishBodyWobbleTuple = readonly [
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
  FishSchoolGroupTransform,
];

export interface FishSchoolProps {
  fishCount: number;
  schoolTransform: FishSchoolGroupTransform;
  bodyWobble: FishBodyWobbleTuple;
}
