export default function AboutPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        <div className="static-hero">
          <div className="static-hero__eyebrow">About</div>
          <h1 className="static-hero__title">What is Dynamizer?</h1>
          <p className="static-hero__subtitle">
            Placeholder — a short, punchy description of what Dynamizer is and who it is for.
          </p>
        </div>

        <div className="static-section">
          <h2 className="static-section__title">Why we built it</h2>
          <p>
            Placeholder — the origin story. Why this project exists, what problem it solves,
            and what itch it scratches.
          </p>
        </div>

        <div className="static-section">
          <h2 className="static-section__title">Principles</h2>
          <ul className="static-list">
            <li>
              <span className="static-list__icon">🎯</span>
              <div>
                <strong>Principle one</strong>
                <p>Placeholder description of this core value.</p>
              </div>
            </li>
            <li>
              <span className="static-list__icon">🚀</span>
              <div>
                <strong>Principle two</strong>
                <p>Placeholder description of this core value.</p>
              </div>
            </li>
            <li>
              <span className="static-list__icon">🤝</span>
              <div>
                <strong>Principle three</strong>
                <p>Placeholder description of this core value.</p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  )
}
