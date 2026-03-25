const TEAM = [
  {
    id: 1,
    emoji: '🐱',
    role: 'Placeholder role',
    bio: 'Placeholder — one quirky sentence about this person.',
    github: 'https://github.com/javisanxe/dynamizer',
  },
  {
    id: 2,
    emoji: '🐶',
    role: 'Placeholder role',
    bio: 'Placeholder — one quirky sentence about this person.',
    github: 'https://github.com/javisanxe/dynamizer',
  },
  {
    id: 3,
    emoji: '🦊',
    role: 'Placeholder role',
    bio: 'Placeholder — one quirky sentence about this person.',
    github: 'https://github.com/javisanxe/dynamizer',
  },
  {
    id: 4,
    emoji: '🐼',
    role: 'Placeholder role',
    bio: 'Placeholder — one quirky sentence about this person.',
    github: 'https://github.com/javisanxe/dynamizer',
  },
]

export default function TeamPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="static-hero">
          <div className="static-hero__eyebrow">Team</div>
          <h1 className="static-hero__title">The people behind it</h1>
          <p className="static-hero__subtitle">
            Placeholder — a short intro about the team. Who you are, where you come from,
            what you share.
          </p>
        </div>

        {/* ── Team grid ─────────────────────────────────────────────────── */}
        <div className="team-grid">
          {TEAM.map((person) => (
            <div key={person.id} className="team-card">
              <div className="team-card__avatar">{person.emoji}</div>
              <div className="team-card__body">
                <p className="team-card__name">Person {person.id}</p>
                <p className="team-card__role">{person.role}</p>
                <p className="team-card__bio">{person.bio}</p>
                <div className="team-card__links">
                  <a
                    href={person.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="team-card__link"
                  >
                    GitHub →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Contributors ──────────────────────────────────────────────── */}
        <div className="os-banner">
          <div className="os-banner__icon">🤝</div>
          <div className="os-banner__body">
            <p className="os-banner__title">Want to contribute?</p>
            <p>
              Dynamizer is open source. Whether it is a bug fix, a new game, or an idea —
              contributions are always welcome.
            </p>
            <a
              href="https://github.com/javisanxe/dynamizer"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ marginTop: 'var(--space-sm)', width: 'fit-content' }}
            >
              Contribute on GitHub →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
