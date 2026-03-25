import { useEffect, useRef, useState } from "react";
import { Canvas } from "./components/Canvas";
import { EventLog } from "./components/EventLog";
import { FileLoader } from "./components/FileLoader";
import { Header } from "./components/Header";
import { InvariantChecker } from "./components/InvariantChecker";
import { LandingPage } from "./components/LandingPage";
import { LogReplicationView } from "./components/LogReplicationView";
import { PlaybackControls } from "./components/PlaybackControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePlayback } from "./hooks/usePlayback";
import { useReplayStore } from "./stores/replayStore";

async function fetchText(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.text();
}

function ReplayPage() {
  const [dragActive, setDragActive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const source = useReplayStore((state) => state.source);
  const warnings = useReplayStore((state) => state.warnings);
  const availableSamples = useReplayStore((state) => state.availableSamples);
  const loadFromText = useReplayStore((state) => state.loadFromText);
  const setAvailableSamples = useReplayStore((state) => state.setAvailableSamples);

  usePlayback();
  useKeyboardShortcuts();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const statusResponse = await fetch("/api/status");
        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as {
            initialText?: string;
            filePath?: string;
            banner?: string;
            sample?: string;
            availableSamples?: string[];
            mode?: string;
          };

          if (cancelled) {
            return;
          }

          if (status.availableSamples) {
            setAvailableSamples(status.availableSamples);
          }

          if (status.initialText) {
            loadFromText(status.initialText, {
              mode: "live",
              label: status.filePath ? `Live: ${status.filePath}` : "Live local replay",
              banner: status.banner
            });
          }

          const stream = new EventSource("/api/stream");
          stream.onmessage = (message) => {
            const payload = JSON.parse(message.data) as { text: string; filePath?: string; banner?: string };
            loadFromText(payload.text, {
              mode: "live",
              label: payload.filePath ? `Live: ${payload.filePath}` : "Live local replay",
              banner: payload.banner
            });
          };
          eventSourceRef.current = stream;
          return;
        }
      } catch (error) {
        // Ignore missing local API in hosted mode.
      }

      const fileParam = new URLSearchParams(window.location.search).get("file");
      if (fileParam) {
        try {
          const text = await fetchText(fileParam);
          if (!cancelled) {
            loadFromText(text, {
              mode: "url",
              label: `Loaded from ${fileParam}`
            });
            return;
          }
        } catch (error) {
          // Fall through to samples.
        }
      }

      const text = await fetchText("/samples/happy-path.jsonl");
      if (!cancelled) {
        loadFromText(text, {
          mode: "sample",
          label: "Sample replay: happy-path",
          banner: "No live events were found, so you are looking at a bundled sample."
        });
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      eventSourceRef.current?.close();
    };
  }, [loadFromText, setAvailableSamples]);

  return (
    <div
      className={`min-h-screen bg-[color:var(--bg-primary)] px-4 py-5 text-[color:var(--text-primary)] md:px-6 ${
        dragActive ? "ring-4 ring-[color:var(--text-accent)]" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (!file) {
          return;
        }
        const text = await file.text();
        loadFromText(text, {
          mode: "upload",
          label: `Uploaded ${file.name}`
        });
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <Header source={source} />
        <FileLoader
          availableSamples={availableSamples}
          onFileText={(text, label) =>
            loadFromText(text, {
              mode: "upload",
              label: `Uploaded ${label}`
            })
          }
          onSampleSelected={async (name) => {
            const text = await fetchText(`/samples/${name}.jsonl`);
            loadFromText(text, {
              mode: "sample",
              label: `Sample replay: ${name}`
            });
          }}
        />

        {warnings.length > 0 ? (
          <section className="rounded-2xl border border-[color:var(--status-warn)] bg-[color:var(--status-warn)]/10 p-4 text-sm text-[color:var(--text-primary)]">
            <strong className="mr-2">Parse warnings:</strong>
            {warnings.join(" ")}
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
          <Canvas />
          <EventLog />
        </div>
        <PlaybackControls />
        <LogReplicationView />
        <InvariantChecker />
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash || "");

  useEffect(() => {
    function onHashChange() {
      setRoute(window.location.hash || "");
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "#/replay") {
    return <ReplayPage />;
  }

  return <LandingPage />;
}
