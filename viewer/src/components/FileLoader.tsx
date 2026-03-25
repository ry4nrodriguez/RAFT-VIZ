import { useId } from "react";

interface FileLoaderProps {
  availableSamples: string[];
  onFileText: (text: string, label: string) => void;
  onSampleSelected: (name: string) => void;
}

export function FileLoader({ availableSamples, onFileText, onSampleSelected }: FileLoaderProps) {
  const inputId = useId();

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-xl border border-[color:var(--border-accent)] bg-[color:var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--text-accent)]"
        >
          Load .jsonl File
        </label>
        <input
          id={inputId}
          type="file"
          accept=".jsonl,.txt,.log"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const text = await file.text();
            onFileText(text, file.name);
            event.currentTarget.value = "";
          }}
        />
        <select
          className="rounded-xl border border-[color:var(--border-accent)] bg-[color:var(--bg-secondary)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              onSampleSelected(event.target.value);
            }
          }}
        >
          <option value="">Sample replay</option>
          {availableSamples.map((sample) => (
            <option key={sample} value={sample}>
              {sample}
            </option>
          ))}
        </select>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Drag and drop also works anywhere on the page.
        </p>
      </div>
    </section>
  );
}

