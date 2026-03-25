package raftviz

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func TestInitCreatesFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	InitWithPath(path, 5)
	defer Shutdown()

	if _, err := os.Stat(path); err != nil {
		t.Fatalf("expected events file to exist: %v", err)
	}
}

func TestEventsWriteValidJSON(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	InitWithPath(path, 5)
	LogStateChange(0, 1, "follower", "candidate")
	LogVoteRequest(0, 1, 1)
	LogAppendEntries(0, 2, 1, 3)
	LogCommit(0, 1, 2, map[string]any{"cmd": "set x 3"})
	Shutdown()

	events := readEvents(t, path)
	if len(events) != 5 {
		t.Fatalf("expected 5 events, got %d", len(events))
	}
}

func TestThreadSafety(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	InitWithPath(path, 5)

	var wg sync.WaitGroup
	for server := 0; server < 5; server++ {
		wg.Add(1)
		go func(server int) {
			defer wg.Done()
			for i := 0; i < 25; i++ {
				LogVoteRequest(server, (server+1)%5, i+1)
			}
		}(server)
	}

	wg.Wait()
	Shutdown()

	events := readEvents(t, path)
	if len(events) != 126 {
		t.Fatalf("expected 126 events including init, got %d", len(events))
	}
}

func TestTimestampsMonotonic(t *testing.T) {
	path := filepath.Join(t.TempDir(), "events.jsonl")
	InitWithPath(path, 3)
	LogElectionTimeout(0, 1)
	time.Sleep(5 * time.Millisecond)
	LogElectionTimeout(1, 1)
	Shutdown()

	events := readEvents(t, path)
	prev := int64(-1)
	for _, event := range events {
		ts, _ := event["ts"].(float64)
		if int64(ts) < prev {
			t.Fatalf("timestamps must be monotonic: %v < %v", ts, prev)
		}
		prev = int64(ts)
	}
}

func TestLogCommitGracefulSerialization(t *testing.T) {
	type badCommand struct {
		Channel chan int
	}

	path := filepath.Join(t.TempDir(), "events.jsonl")
	InitWithPath(path, 3)
	LogCommit(0, 1, 1, badCommand{Channel: make(chan int)})
	Shutdown()

	events := readEvents(t, path)
	last := events[len(events)-1]
	if _, ok := last["command"].(string); !ok {
		t.Fatalf("expected string fallback for unserializable command, got %#v", last["command"])
	}
}

func readEvents(t *testing.T, path string) []map[string]any {
	t.Helper()

	file, err := os.Open(path)
	if err != nil {
		t.Fatalf("open events file: %v", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var events []map[string]any
	for scanner.Scan() {
		var payload map[string]any
		if err := json.Unmarshal(scanner.Bytes(), &payload); err != nil {
			t.Fatalf("invalid json line: %v", err)
		}
		events = append(events, payload)
	}

	if err := scanner.Err(); err != nil {
		t.Fatalf("scan events file: %v", err)
	}

	return events
}
