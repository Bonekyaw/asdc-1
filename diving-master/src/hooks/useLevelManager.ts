import { useMemo } from "react";

const DEFAULT_POINTS_PER_LEVEL = 5000;

export interface LevelManagerState {
  level: number;
  pointsPerLevel: number;
  progressWithinLevel: number;
}

export function useLevelManager(
  score: number,
  pointsPerLevel = DEFAULT_POINTS_PER_LEVEL,
): LevelManagerState {
  return useMemo(() => {
    const safePointsPerLevel = Math.max(1, pointsPerLevel);
    const level = 1 + Math.floor(score / safePointsPerLevel);
    const progressWithinLevel = (score % safePointsPerLevel) / safePointsPerLevel;

    return {
      level,
      pointsPerLevel: safePointsPerLevel,
      progressWithinLevel,
    };
  }, [pointsPerLevel, score]);
}
