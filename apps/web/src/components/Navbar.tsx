'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/games',   label: 'Games' },
  { href: '/about',   label: 'About' },
  { href: '/team',    label: 'Team' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          🎮 <span>Dynamizer</span>
        </Link>

        <ul className={`navbar-links${open ? ' navbar-links--open' : ''}`}>
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`navbar-link${pathname === href ? ' navbar-link--active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="btn btn-accent navbar-cta">
          ▶ Play
        </Link>

        <button
          className="navbar-hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-hamburger__bar" />
          <span className="navbar-hamburger__bar" />
          <span className="navbar-hamburger__bar" />
        </button>
      </div>
    </nav>
  )
}
