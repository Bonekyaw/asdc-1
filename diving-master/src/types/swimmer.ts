import type { Group } from "@shopify/react-native-skia";
import type { ComponentProps } from "react";

/** Matches Skia `Group`’s `transform` prop (includes Reanimated animated matrices). */
export type SkiaGroupTransformProp = NonNullable<
  ComponentProps<typeof Group>["transform"]
>;

export interface SwimmerProps {
  rootTransform: SkiaGroupTransformProp;
  armTransformLeft: SkiaGroupTransformProp;
  armTransformRight: SkiaGroupTransformProp;
  legTransformLeft: SkiaGroupTransformProp;
  legTransformRight: SkiaGroupTransformProp;
}
