# Example Raft Instrumentation

This sample shows where `raftvis` calls fit into a 6.5840-style Raft implementation.

- initialize once in `Make()`
- log role transitions wherever your implementation already changes roles
- log vote requests before sending RPCs
- log vote grants/denials from your `RequestVote` handler
- log append traffic and commit/application events for richer replay

