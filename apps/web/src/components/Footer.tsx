import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/games',   label: 'Games' },
  { href: '/about',   label: 'About' },
  { href: '/team',    label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link href="/" className="footer-brand">
          🎮 Dynamizer
        </Link>

        <ul className="footer-links">
          {FOOTER_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="footer-link">{label}</Link>
            </li>
          ))}
          <li>
            <a
              href="https://github.com/javisanxe/dynamizer"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
          </li>
        </ul>

        <p className="footer-copy">
          Open source · MIT License
        </p>
      </div>
    </footer>
  )
}
