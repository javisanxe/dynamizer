const TEAM = [
  { id: 1, emoji: '🐱', role: 'Placeholder role', bio: 'Placeholder — one quirky sentence about this person.' },
  { id: 2, emoji: '🐶', role: 'Placeholder role', bio: 'Placeholder — one quirky sentence about this person.' },
  { id: 3, emoji: '🦊', role: 'Placeholder role', bio: 'Placeholder — one quirky sentence about this person.' },
  { id: 4, emoji: '🐼', role: 'Placeholder role', bio: 'Placeholder — one quirky sentence about this person.' },
]

export default function TeamPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        <div className="static-hero">
          <div className="static-hero__eyebrow">Team</div>
          <h1 className="static-hero__title">The people behind it</h1>
          <p className="static-hero__subtitle">
            Placeholder — a short intro about the team. Who you are, where you come from,
            what you share.
          </p>
        </div>

        <div className="team-grid">
          {TEAM.map((person) => (
            <div key={person.id} className="team-card">
              <div className="team-card__avatar">{person.emoji}</div>
              <div className="team-card__body">
                <p className="team-card__name">Person {person.id}</p>
                <p className="team-card__role">{person.role}</p>
                <p className="team-card__bio">{person.bio}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
