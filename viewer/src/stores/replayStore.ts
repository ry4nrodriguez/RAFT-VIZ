import { create } from "zustand";
import { buildReplayState } from "../engine/eventProcessor";
import { parseJsonl } from "../engine/parser";
import type { RaftEvent, ReplayState, StoreSource } from "../engine/types";

const SAMPLE_NAMES = ["happy-path", "leader-crash", "split-vote", "network-partition"];

interface ReplayStore {
  events: RaftEvent[];
  warnings: string[];
  replayState: ReplayState;
  activeIndex: number;
  isPlaying: boolean;
  speed: number;
  source: StoreSource;
  search: string;
  selectedServer: number | null;
  activeTypes: Record<string, boolean>;
  availableSamples: string[];
  loadFromText: (text: string, source: StoreSource) => void;
  setActiveIndex: (index: number) => void;
  step: (delta: number) => void;
  togglePlaying: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  setSearch: (search: string) => void;
  toggleEventType: (eventType: string) => void;
  setSelectedServer: (server: number | null) => void;
  setAvailableSamples: (samples: string[]) => void;
}

const DEFAULT_TYPES: Record<string, boolean> = {
  state_change: true,
  election_timeout: true,
  vote_request: true,
  vote_granted: true,
  vote_denied: true,
  append_entries: true,
  append_response: true,
  commit: true,
  crash: true,
  restart: true,
  custom: true,
  init: true
};

const emptyReplayState = buildReplayState([], -1);

export const useReplayStore = create<ReplayStore>((set, get) => ({
  events: [],
  warnings: [],
  replayState: emptyReplayState,
  activeIndex: -1,
  isPlaying: false,
  speed: 1,
  source: {
    mode: "empty",
    label: "No events loaded",
    banner: "Run your Raft tests, then load the generated JSONL file to replay the cluster."
  },
  search: "",
  selectedServer: null,
  activeTypes: DEFAULT_TYPES,
  availableSamples: SAMPLE_NAMES,
  loadFromText: (text, source) => {
    const parsed = parseJsonl(text);
    const nextIndex = parsed.events.length > 0 ? 0 : -1;
    set({
      events: parsed.events,
      warnings: parsed.warnings,
      source,
      activeIndex: nextIndex,
      replayState: buildReplayState(parsed.events, nextIndex, parsed.warnings),
      isPlaying: false
    });
  },
  setActiveIndex: (index) => {
    const bounded = get().events.length === 0 ? -1 : Math.max(0, Math.min(index, get().events.length - 1));
    set({
      activeIndex: bounded,
      replayState: buildReplayState(get().events, bounded, get().warnings)
    });
  },
  step: (delta) => {
    get().setActiveIndex(get().activeIndex + delta);
  },
  togglePlaying: () => {
    set({ isPlaying: !get().isPlaying });
  },
  reset: () => {
    const nextIndex = get().events.length > 0 ? 0 : -1;
    set({
      activeIndex: nextIndex,
      isPlaying: false,
      replayState: buildReplayState(get().events, nextIndex, get().warnings)
    });
  },
  setSpeed: (speed) => set({ speed }),
  setSearch: (search) => set({ search }),
  toggleEventType: (eventType) =>
    set({
      activeTypes: {
        ...get().activeTypes,
        [eventType]: !get().activeTypes[eventType]
      }
    }),
  setSelectedServer: (server) => set({ selectedServer: server }),
  setAvailableSamples: (samples) => set({ availableSamples: samples.length > 0 ? samples : SAMPLE_NAMES })
}));

