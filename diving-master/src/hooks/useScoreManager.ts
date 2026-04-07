import { useEffect, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";

const SCORE_ANIMATION_DURATION_MS = 320;
const HIGH_SCORE_FILE_NAME = "diving-master-high-score.json";

interface StoredHighScore {
  highScore: number;
}

export interface ScoreManagerState {
  score: number;
  displayedScore: number;
  highScore: number;
  didIncrease: boolean;
}

async function readHighScore(): Promise<number> {
  if (!FileSystem.documentDirectory) {
    return 0;
  }

  const uri = `${FileSystem.documentDirectory}${HIGH_SCORE_FILE_NAME}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return 0;
  }

  const raw = await FileSystem.readAsStringAsync(uri);
  const parsed = JSON.parse(raw) as StoredHighScore;
  return typeof parsed.highScore === "number" ? parsed.highScore : 0;
}

async function writeHighScore(highScore: number): Promise<void> {
  if (!FileSystem.documentDirectory) {
    return;
  }

  const uri = `${FileSystem.documentDirectory}${HIGH_SCORE_FILE_NAME}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify({ highScore }));
}

export function useScoreManager(score: number): ScoreManagerState {
  const [displayedScore, setDisplayedScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const previousScoreRef = useRef(score);
  const animationFrameRef = useRef<number | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    void readHighScore()
      .then((storedHighScore) => {
        if (!isMounted) {
          return;
        }
        setHighScore(storedHighScore);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setHighScore(0);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const previousScore = previousScoreRef.current;
    previousScoreRef.current = score;

    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (score <= previousScore) {
      setDisplayedScore(score);
      return;
    }

    const startedAt = Date.now();
    const delta = score - previousScore;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / SCORE_ANIMATION_DURATION_MS);
      setDisplayedScore(previousScore + Math.round(delta * progress));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [score]);

  useEffect(() => {
    if (!isLoaded || score <= highScore) {
      return;
    }

    setHighScore(score);
    if (persistTimeoutRef.current != null) {
      clearTimeout(persistTimeoutRef.current);
    }
    persistTimeoutRef.current = setTimeout(() => {
      void writeHighScore(score).catch(() => {});
      persistTimeoutRef.current = null;
    }, 250);
  }, [highScore, isLoaded, score]);

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current != null) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      score,
      displayedScore,
      highScore,
      didIncrease: score > displayedScore,
    }),
    [displayedScore, highScore, score],
  );
}
