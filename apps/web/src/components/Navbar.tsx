'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/games',   label: 'Games' },
  { href: '/about',   label: 'About' },
  { href: '/team',    label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          🎮 <span>Dynamizer</span>
        </Link>

        <ul className="navbar-links">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`navbar-link${pathname === href ? ' navbar-link--active' : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="btn btn-accent navbar-cta">
          ▶ Play
        </Link>
      </div>
    </nav>
  )
}
