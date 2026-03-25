const CONTACT_OPTIONS = [
  {
    icon: '🐛',
    title: 'Bug report',
    description: 'Found something broken? Open an issue on GitHub.',
    action: 'Open an issue',
    href: 'https://github.com/javisanxe/dynamizer/issues/new',
  },
  {
    icon: '💡',
    title: 'Feature request',
    description: 'Have an idea? Start a discussion on GitHub.',
    action: 'Start a discussion',
    href: 'https://github.com/javisanxe/dynamizer/discussions',
  },
  {
    icon: '✉️',
    title: 'Everything else',
    description: 'Press, partnerships, or anything that does not fit above.',
    action: 'placeholder@email.com',
    href: 'mailto:placeholder@email.com',
  },
]

export default function ContactPage() {
  return (
    <div className="static-page">
      <div className="static-container">

        <div className="static-hero">
          <div className="static-hero__eyebrow">Contact</div>
          <h1 className="static-hero__title">Get in touch</h1>
          <p className="static-hero__subtitle">
            Pick the channel that fits your question. We try to respond within a week.
          </p>
        </div>

        <div className="contact-list">
          {CONTACT_OPTIONS.map((option) => (
            <a
              key={option.title}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-card"
            >
              <div className="contact-card__icon">{option.icon}</div>
              <div className="contact-card__body">
                <p className="contact-card__title">{option.title}</p>
                <p className="contact-card__description">{option.description}</p>
                <span className="contact-card__action">{option.action} →</span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
