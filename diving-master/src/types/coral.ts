import type { FishSchoolGroupTransform } from "@/src/types/fish-school";

export type CoralPalette = {
  base: string;
  mid: string;
  highlight: string;
};

export interface CoralProps {
  rootTransform: FishSchoolGroupTransform;
  branchPath: string;
  innerBranchPath: string;
  palette: CoralPalette;
}
