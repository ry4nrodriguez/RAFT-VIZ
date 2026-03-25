package raftvis

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const schemaVersion = "1.0"

type loggerState struct {
	mu       sync.Mutex
	file     *os.File
	start    time.Time
	path     string
	numPeers int
	closed   bool
}

var global loggerState

func Init(numPeers int) {
	defaultPath := filepath.Join(userHomeDir(), ".raftvis", "events.jsonl")
	InitWithPath(defaultPath, numPeers)
}

func InitWithPath(path string, numPeers int) {
	if numPeers <= 0 {
		numPeers = 1
	}

	resolvedPath := expandHome(path)
	dir := filepath.Dir(resolvedPath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return
	}

	file, err := os.Create(resolvedPath)
	if err != nil {
		return
	}

	global.mu.Lock()
	defer global.mu.Unlock()

	if global.file != nil {
		_ = global.file.Close()
	}

	global.file = file
	global.path = resolvedPath
	global.start = time.Now()
	global.closed = false
	global.numPeers = numPeers

	writeLocked(map[string]any{
		"ts":        0,
		"event":     "init",
		"num_peers": numPeers,
		"version":   schemaVersion,
	})
}

func Shutdown() {
	global.mu.Lock()
	defer global.mu.Unlock()

	if global.file == nil || global.closed {
		return
	}

	global.closed = true
	_ = global.file.Close()
	global.file = nil
}

func LogStateChange(server, term int, fromState, toState string) {
	payload := map[string]any{
		"event":    "state_change",
		"server":   server,
		"term":     term,
		"to_state": toState,
	}
	if fromState != "" {
		payload["from_state"] = fromState
	}
	logEvent(payload)
}

func LogElectionTimeout(server, term int) {
	logEvent(map[string]any{
		"event":  "election_timeout",
		"server": server,
		"term":   term,
	})
}

func LogVoteRequest(from, to, term int) {
	logEvent(map[string]any{
		"event":  "vote_request",
		"server": from,
		"from":   from,
		"to":     to,
		"term":   term,
	})
}

func LogVoteGranted(candidate, voter, term int) {
	logVote("vote_granted", candidate, voter, term)
}

func LogVoteDenied(candidate, voter, term int) {
	logVote("vote_denied", candidate, voter, term)
}

func LogAppendEntries(from, to, term, entryCount int) {
	logEvent(map[string]any{
		"event":       "append_entries",
		"server":      from,
		"from":        from,
		"to":          to,
		"term":        term,
		"entry_count": entryCount,
	})
}

func LogAppendResponse(leader, responder, term int, success bool) {
	logEvent(map[string]any{
		"event":   "append_response",
		"server":  responder,
		"from":    responder,
		"to":      leader,
		"term":    term,
		"success": success,
	})
}

func LogCommit(server, term, index int, command interface{}) {
	logEvent(map[string]any{
		"event":   "commit",
		"server":  server,
		"term":    term,
		"index":   index,
		"command": sanitizeCommand(command),
	})
}

func LogCrash(server, term int) {
	logEvent(map[string]any{
		"event":  "crash",
		"server": server,
		"term":   term,
	})
}

func LogRestart(server, term int) {
	logEvent(map[string]any{
		"event":  "restart",
		"server": server,
		"term":   term,
	})
}

func LogCustom(server, term int, eventType, detail string) {
	if strings.TrimSpace(eventType) == "" {
		eventType = "custom"
	}

	logEvent(map[string]any{
		"event":  eventType,
		"server": server,
		"term":   term,
		"detail": detail,
	})
}

func logVote(kind string, candidate, voter, term int) {
	logEvent(map[string]any{
		"event":  kind,
		"server": voter,
		"from":   voter,
		"to":     candidate,
		"term":   term,
	})
}

func logEvent(payload map[string]any) {
	global.mu.Lock()
	defer global.mu.Unlock()

	if global.file == nil || global.closed {
		return
	}

	payload["ts"] = timestampLocked()
	writeLocked(payload)
}

func writeLocked(payload map[string]any) {
	if global.file == nil || global.closed {
		return
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return
	}

	_, _ = global.file.Write(append(encoded, '\n'))
	_ = global.file.Sync()
}

func timestampLocked() int64 {
	if global.start.IsZero() {
		return 0
	}
	return time.Since(global.start).Milliseconds()
}

func sanitizeCommand(command interface{}) any {
	if command == nil {
		return nil
	}

	encoded, err := json.Marshal(command)
	if err == nil {
		var decoded any
		if err := json.Unmarshal(encoded, &decoded); err == nil {
			return decoded
		}
	}

	return fmt.Sprintf("%v", command)
}

func userHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return "."
	}
	return home
}

func expandHome(path string) string {
	if strings.HasPrefix(path, "~/") {
		return filepath.Join(userHomeDir(), strings.TrimPrefix(path, "~/"))
	}
	return path
}

