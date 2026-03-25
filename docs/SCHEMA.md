# RaftVis Event Schema

Every event is written as one JSON object per line.

## Base Fields

```json
{
  "ts": 0,
  "event": "init",
  "server": 0,
  "term": 1
}
```

- `ts`: milliseconds since `Init()` in the instrumentation library
- `event`: type discriminator
- `server`: optional server index most associated with the event
- `term`: optional Raft term at the time of the event

## Supported Events

### `init`

```json
{ "ts": 0, "event": "init", "num_peers": 5, "version": "1.0" }
```

### `state_change`

```json
{
  "ts": 325,
  "event": "state_change",
  "server": 2,
  "term": 1,
  "from_state": "follower",
  "to_state": "candidate"
}
```

### `election_timeout`

```json
{ "ts": 320, "event": "election_timeout", "server": 2, "term": 1 }
```

### `vote_request`

```json
{ "ts": 330, "event": "vote_request", "server": 2, "from": 2, "to": 0, "term": 1 }
```

### `vote_granted` / `vote_denied`

```json
{ "ts": 390, "event": "vote_granted", "server": 0, "from": 0, "to": 2, "term": 1 }
```

### `append_entries`

```json
{
  "ts": 450,
  "event": "append_entries",
  "server": 2,
  "from": 2,
  "to": 0,
  "term": 1,
  "entry_count": 0
}
```

### `append_response`

```json
{
  "ts": 500,
  "event": "append_response",
  "server": 0,
  "from": 0,
  "to": 2,
  "term": 1,
  "success": true
}
```

### `commit`

```json
{
  "ts": 680,
  "event": "commit",
  "server": 2,
  "term": 1,
  "index": 1,
  "command": "set x 3"
}
```

### `crash`

```json
{ "ts": 900, "event": "crash", "server": 2, "term": 1 }
```

### `restart`

```json
{ "ts": 1400, "event": "restart", "server": 2, "term": 1 }
```

### `custom`

```json
{
  "ts": 500,
  "event": "custom",
  "server": 1,
  "term": 2,
  "detail": "snapshot installed, trimmed log to index 45"
}
```

## Compatibility Rules

- unknown event types must be preserved and surfaced in the UI as generic events
- missing optional fields should not break parsing
- viewers should use `warning` rather than `failure` when insufficient data exists for a strict invariant

