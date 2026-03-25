const GAMES = [
  {
    slug: 'tic_tac_toe',
    icon: '⬜',
    title: "Tic-Tac-Toe",
    tagline: "Classic 3×3 strategy",
    description:
      "Placeholder — short description of the game, how it works, and what makes it fun.",
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
      "Placeholder — short description of the game, how it works, and what makes it fun.",
    players: "3–8 players",
    duration: "~30 min",
    status: 'coming_soon' as const,
  },
]

export default function GamesPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        <div className="static-hero">
          <div className="static-hero__eyebrow">Games</div>
          <h1 className="static-hero__title">Available games</h1>
          <p className="static-hero__subtitle">
            Every game is designed to be played in real time with your group, no downloads required.
          </p>
        </div>

        <div className="games-grid">
          {GAMES.map((game) => (
            <div key={game.slug} className="game-card">
              <div className="game-card__icon">{game.icon}</div>
              <div className="game-card__body">
                <div className="game-card__header">
                  <h2 className="game-card__title">{game.title}</h2>
                  {game.status === 'coming_soon' && (
                    <span className="badge">Soon</span>
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
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
