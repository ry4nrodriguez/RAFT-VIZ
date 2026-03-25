# Contributing

## Setup

```bash
npm install
npm run test
npm run build
```

Go tests:

```bash
cd go
go test ./...
```

## Principles

- keep the Go library copy-paste friendly and dependency free
- preserve backward compatibility for baseline event schema fields
- prefer deterministic replay logic over implicit animation state
- mark uncertain diagnostics as warnings, not hard failures

## Pull Requests

- add or update tests for parser, replay engine, invariants, CLI behavior, or Go event emission as appropriate
- include before/after screenshots for visible viewer changes when possible
- keep docs and instrumentation snippets aligned with any API changes

