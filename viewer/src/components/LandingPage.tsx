const GITHUB_URL = "https://github.com/ry4nrodriguez/RAFT-VIZ";

export function LandingPage() {
  return (
    <main className="landing-shell">
      <section className="landing-panel">
        <div className="logo-wordmark" aria-label="RaftViz">
          <span className="logo-wordmark-shadow" aria-hidden="true">
            RAFTVIZ
          </span>
          <span className="logo-wordmark-glow" aria-hidden="true">
            RAFTVIZ
          </span>
          <span className="logo-wordmark-face">RAFTVIZ</span>
        </div>

        <p className="landing-kicker">THE RAFT DEBUGGING VISUALIZER</p>

        <p className="landing-copy">
          I built RaftViz because debugging a broken Raft implementation usually means staring at thousands of
          interleaved log lines and trying to simulate five goroutines in your head. This turns those same events
          into something you can actually watch, replay, and reason about when elections, replication, or leadership
          transitions stop making sense.
        </p>

        <a className="landing-button" href={GITHUB_URL} target="_blank" rel="noreferrer">
          Go to GitHub
        </a>
      </section>
    </main>
  );
}
