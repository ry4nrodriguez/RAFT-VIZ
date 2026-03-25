export type ServerRole = "follower" | "candidate" | "leader" | "crashed" | "restarting" | "unknown";

export interface BaseEvent {
  ts: number;
  event: string;
  server?: number;
  term?: number;
  [key: string]: unknown;
}

export interface InitEvent extends BaseEvent {
  event: "init";
  num_peers?: number;
  version?: string;
}

export interface StateChangeEvent extends BaseEvent {
  event: "state_change";
  server: number;
  term: number;
  from_state?: string;
  to_state: string;
}

export interface VoteEvent extends BaseEvent {
  event: "vote_request" | "vote_granted" | "vote_denied";
  from: number;
  to: number;
  term: number;
}

export interface AppendEntriesEvent extends BaseEvent {
  event: "append_entries";
  from: number;
  to: number;
  term: number;
  entry_count?: number;
}

export interface AppendResponseEvent extends BaseEvent {
  event: "append_response";
  from: number;
  to: number;
  term: number;
  success?: boolean;
}

export interface CommitEvent extends BaseEvent {
  event: "commit";
  server: number;
  term: number;
  index: number;
  command: unknown;
}

export interface DetailEvent extends BaseEvent {
  event: "custom" | "crash" | "restart" | "election_timeout";
  detail?: string;
}

export type KnownRaftEvent =
  | InitEvent
  | StateChangeEvent
  | VoteEvent
  | AppendEntriesEvent
  | AppendResponseEvent
  | CommitEvent
  | DetailEvent;

export type RaftEvent = KnownRaftEvent | BaseEvent;

export interface ParsedLog {
  events: RaftEvent[];
  warnings: string[];
}

export interface MessageAnimationState {
  id: string;
  type: string;
  from: number;
  to: number;
  label: string;
  color: string;
  startedAt: number;
  duration: number;
}

export interface SpeechBubbleState {
  text: string;
  untilTs: number;
  level: "info" | "warn" | "error";
}

export interface CommitCell {
  index: number;
  command: string;
  term: number;
  committed: boolean;
  approximate?: boolean;
}

export interface ServerViewState {
  id: number;
  role: ServerRole;
  term: number;
  alive: boolean;
  approxLogLength: number;
  commitCells: CommitCell[];
  speech?: SpeechBubbleState;
}

export interface InvariantResult {
  id: string;
  title: string;
  status: "pass" | "warn" | "fail";
  message: string;
  eventIndex?: number;
  servers?: number[];
}

export interface ReplayState {
  numPeers: number;
  currentIndex: number;
  currentTs: number;
  visibleEvents: RaftEvent[];
  servers: ServerViewState[];
  messages: MessageAnimationState[];
  invariants: InvariantResult[];
  warnings: string[];
  approximate: boolean;
  leadersByTerm: Record<number, number[]>;
  commitIndex: number;
  highlightedServers: number[];
}

export interface StoreSource {
  mode: "empty" | "sample" | "upload" | "url" | "live";
  label: string;
  banner?: string;
}

