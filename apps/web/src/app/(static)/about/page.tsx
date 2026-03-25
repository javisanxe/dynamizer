export default function AboutPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="static-hero">
          <div className="static-hero__eyebrow">About</div>
          <h1 className="static-hero__title">
            Games that bring people{' '}
            <span className="text-accent">together.</span>
          </h1>
          <p className="static-hero__subtitle">
            Dynamizer is a real-time multiplayer platform for social party games.
            No app, no account — just open a link and play with anyone in the room.
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-item__value">0 s</span>
            <span className="stat-item__label">Setup time</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">2+</span>
            <span className="stat-item__label">Games available</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">8</span>
            <span className="stat-item__label">Max players</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">100%</span>
            <span className="stat-item__label">Free forever</span>
          </div>
        </div>

        {/* ── Why we built it ───────────────────────────────────────────── */}
        <div className="static-section">
          <h2 className="static-section__title">Why we built it</h2>
          <p>
            Placeholder — the origin story. Why this project exists, what problem it solves,
            and what itch it scratches.
          </p>
        </div>

        {/* ── Principles ────────────────────────────────────────────────── */}
        <div className="static-section">
          <h2 className="static-section__title">Principles</h2>
          <ul className="static-list">
            <li>
              <span className="static-list__icon">⚡</span>
              <div>
                <strong>Zero friction</strong>
                <p>Share a link. That is it. No sign-ups, no downloads, no waiting.</p>
              </div>
            </li>
            <li>
              <span className="static-list__icon">🎯</span>
              <div>
                <strong>Built for the room</strong>
                <p>Designed for people who are physically together — or in a video call.</p>
              </div>
            </li>
            <li>
              <span className="static-list__icon">🔓</span>
              <div>
                <strong>Open by default</strong>
                <p>The code is public. The games are free. No hidden costs, ever.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* ── Open source ───────────────────────────────────────────────── */}
        <div className="os-banner">
          <div className="os-banner__icon">⭐</div>
          <div className="os-banner__body">
            <p className="os-banner__title">Dynamizer is open source</p>
            <p>
              The full source code is available on GitHub under the MIT license.
              Contributions, bug reports, and feature requests are welcome.
            </p>
            <a
              href="https://github.com/javisanxe/dynamizer"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ marginTop: 'var(--space-sm)', width: 'fit-content' }}
            >
              View on GitHub →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
