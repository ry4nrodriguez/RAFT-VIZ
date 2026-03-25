import { useEffect } from "react";
import { useReplayStore } from "../stores/replayStore";

export function usePlayback() {
  const activeIndex = useReplayStore((state) => state.activeIndex);
  const events = useReplayStore((state) => state.events);
  const isPlaying = useReplayStore((state) => state.isPlaying);
  const speed = useReplayStore((state) => state.speed);
  const setActiveIndex = useReplayStore((state) => state.setActiveIndex);
  const togglePlaying = useReplayStore((state) => state.togglePlaying);

  useEffect(() => {
    if (!isPlaying || activeIndex < 0 || activeIndex >= events.length - 1) {
      return;
    }

    const current = events[activeIndex];
    const next = events[activeIndex + 1];
    const delta = Math.max(140, Math.min(1400, (next.ts - current.ts) / speed));

    const handle = window.setTimeout(() => {
      if (activeIndex + 1 >= events.length - 1) {
        setActiveIndex(events.length - 1);
        if (isPlaying) {
          togglePlaying();
        }
        return;
      }
      setActiveIndex(activeIndex + 1);
    }, delta);

    return () => window.clearTimeout(handle);
  }, [activeIndex, events, isPlaying, setActiveIndex, speed, togglePlaying]);
}

