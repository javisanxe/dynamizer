import Link from 'next/link'

const GAMES = [
  {
    slug: 'tic_tac_toe',
    icon: '⬜',
    title: "Tic-Tac-Toe",
    tagline: "Classic 3×3 strategy",
    description:
      "Two players take turns marking a 3×3 grid. First to land three in a row wins. Simple to learn, surprisingly tense.",
    players: "2 players",
    duration: "~5 min",
    status: 'available' as const,
  },
  {
    slug: 'times_up',
    icon: '🃏',
    title: "Time's Up!",
    tagline: "Cards, clues & chaos",
    description:
      "Teams race to guess famous characters across three progressively harder rounds — free clues, then one word, then pure mime.",
    players: "3–8 players",
    duration: "~30 min",
    status: 'coming_soon' as const,
  },
]

export default function GamesPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="static-hero">
          <div className="static-hero__eyebrow">Games</div>
          <h1 className="static-hero__title">
            Pick a game,{' '}
            <span className="text-accent">start playing.</span>
          </h1>
          <p className="static-hero__subtitle">
            Every game runs in your browser in real time. No downloads, no accounts — just share the link.
          </p>
        </div>

        {/* ── Games grid ────────────────────────────────────────────────── */}
        <div className="games-grid">
          {GAMES.map((game) => (
            <div
              key={game.slug}
              className={`game-card${game.status === 'available' ? ' game-card--available' : ' game-card--coming-soon'}`}
            >
              <div className="game-card__icon">{game.icon}</div>
              <div className="game-card__body">
                <div className="game-card__header">
                  <h2 className="game-card__title">{game.title}</h2>
                  {game.status === 'coming_soon' && (
                    <span className="badge">Coming soon</span>
                  )}
                  {game.status === 'available' && (
                    <span className="badge badge-primary">Live</span>
                  )}
                </div>
                <p className="game-card__tagline">{game.tagline}</p>
                <p className="game-card__description">{game.description}</p>
                <div className="game-card__meta">
                  <span>👥 {game.players}</span>
                  <span>⏱ {game.duration}</span>
                </div>
                {game.status === 'available' && (
                  <div className="game-card__cta">
                    <Link href="/" className="btn btn-primary">
                      ▶ Play now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
