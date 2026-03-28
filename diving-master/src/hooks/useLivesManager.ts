import { useEffect, useMemo, useRef, useState } from "react";

const TOTAL_LIVES = 4;

export interface LivesManagerState {
  totalLives: number;
  lives: number;
  heartStates: boolean[];
  lostHeartIndex: number | null;
  lossAnimationKey: number;
  isGameOver: boolean;
}

export function useLivesManager(lives: number): LivesManagerState {
  const previousLivesRef = useRef(lives);
  const [lostHeartIndex, setLostHeartIndex] = useState<number | null>(null);
  const [lossAnimationKey, setLossAnimationKey] = useState(0);

  useEffect(() => {
    if (lives < previousLivesRef.current) {
      setLostHeartIndex(Math.max(0, lives));
      setLossAnimationKey((current) => current + 1);
    }

    previousLivesRef.current = lives;
  }, [lives]);

  const heartStates = useMemo(
    () => Array.from({ length: TOTAL_LIVES }, (_, index) => index < lives),
    [lives],
  );

  return {
    totalLives: TOTAL_LIVES,
    lives,
    heartStates,
    lostHeartIndex,
    lossAnimationKey,
    isGameOver: lives <= 0,
  };
}
