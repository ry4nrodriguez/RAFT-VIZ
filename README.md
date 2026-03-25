# RaftViz

Drop-in visualization for your Raft implementation.
Add a small amount of Go instrumentation, run your tests, and replay your cluster as an animated pixel-art.

## What It Includes

- `go/raftviz.go`: single-file Go instrumentation library with no external dependencies
- `viewer/`: React + TypeScript replay UI for uploads, hosted samples, and live local watching
- `cli/`: `npx raftviz` local server with file watching and SSE-based viewer updates

## 2-Minute Setup

### 1. Copy the instrumentation file

```bash
curl -o raftviz.go https://raw.githubusercontent.com/YOUR_GITHUB/RAFT-VIZ/main/go/raftviz.go
```

### 2. Add the minimum calls

```go
// In Make():
raftviz.Init(len(peers))
raftviz.LogStateChange(rf.me, 0, "init", "follower")

// When transitioning to candidate:
raftviz.LogStateChange(rf.me, rf.currentTerm, "follower", "candidate")

// When transitioning to leader:
raftviz.LogStateChange(rf.me, rf.currentTerm, "candidate", "leader")

// When stepping down:
raftviz.LogStateChange(rf.me, rf.currentTerm, oldRole, "follower")
```

### 3. Run your tests

```bash
go test -run 3A
```

### 4. Open the replay

```bash
npx raftviz
```

If no local events file exists yet, the viewer opens with built-in sample replays and a banner that tells the student what to do next.

## Full Recommended Instrumentation

```go
// In Make():
raftviz.Init(len(peers))
raftviz.LogStateChange(rf.me, 0, "init", "follower")

// Election timeout:
raftviz.LogElectionTimeout(rf.me, rf.currentTerm)

// Before RequestVote RPC:
raftviz.LogVoteRequest(rf.me, server, rf.currentTerm)

// In RequestVote handler:
if grantVote {
    raftviz.LogVoteGranted(args.CandidateId, rf.me, args.Term)
} else {
    raftviz.LogVoteDenied(args.CandidateId, rf.me, args.Term)
}

// Before AppendEntries RPC:
raftviz.LogAppendEntries(rf.me, server, rf.currentTerm, len(entries))

// In AppendEntries handler:
raftviz.LogAppendResponse(args.LeaderId, rf.me, args.Term, success)

// On applyCh send:
raftviz.LogCommit(rf.me, rf.currentTerm, msg.CommandIndex, msg.Command)

// Optional crash/restart hooks:
raftviz.LogCrash(rf.me, rf.currentTerm)
raftviz.LogRestart(rf.me, rf.currentTerm)
```

## Local Development

```bash
npm install
npm run test
npm run build
```

CLI usage:

```bash
npx raftviz
npx raftviz ~/.raftviz/events.jsonl
npx raftviz --watch ~/.raftviz/events.jsonl --port 8420
```

## Viewer Features

- circular pixel-art cluster visualization
- timeline playback with keyboard shortcuts
- event log sidebar with filters and search
- approximate replication panel driven by commits and append traffic
- invariant checker for core Raft safety properties
- built-in samples for happy path, split vote, leader crash, and network partition

## Keyboard Shortcuts

- `Space`: play/pause
- `Right Arrow`: step forward
- `Left Arrow`: step back
- `Shift+Right`: jump forward 10 events
- `+` / `-`: adjust speed
- `1-5`: speed presets
- `R`: reset replay
- `F`: toggle fullscreen

## Repository Layout

```text
go/       Go instrumentation library and tests
viewer/   React replay UI
cli/      npm CLI + local file watcher + SSE server
docs/     schema, contributing guide, release assets
samples/  example instrumentation snippets
```
