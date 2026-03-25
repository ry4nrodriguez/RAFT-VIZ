import { useEffect } from "react";
import { useReplayStore } from "../stores/replayStore";

const SPEEDS = [0.25, 0.5, 1, 2, 5];

export function useKeyboardShortcuts() {
  const togglePlaying = useReplayStore((state) => state.togglePlaying);
  const step = useReplayStore((state) => state.step);
  const reset = useReplayStore((state) => state.reset);
  const speed = useReplayStore((state) => state.speed);
  const setSpeed = useReplayStore((state) => state.setSpeed);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlaying();
      } else if (event.key === "ArrowRight" && event.shiftKey) {
        step(10);
      } else if (event.key === "ArrowRight") {
        step(1);
      } else if (event.key === "ArrowLeft") {
        step(-1);
      } else if (event.key.toLowerCase() === "r") {
        reset();
      } else if (event.key === "+" || event.key === "=") {
        const next = SPEEDS.find((candidate) => candidate > speed) ?? SPEEDS[SPEEDS.length - 1];
        setSpeed(next);
      } else if (event.key === "-") {
        const reversed = [...SPEEDS].reverse();
        const next = reversed.find((candidate) => candidate < speed) ?? SPEEDS[0];
        setSpeed(next);
      } else if (/^[1-5]$/.test(event.key)) {
        setSpeed(SPEEDS[Number(event.key) - 1]);
      } else if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void document.documentElement.requestFullscreen();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reset, setSpeed, speed, step, togglePlaying]);
}

