import './BookShell.css'

export default function BookShell({ eyebrow, title, subtitle, left, right, footer }) {
  return (
    <main className="reading-scene">
      <header className="reading-heading">
        <div><span className="reading-kicker">SuperSede · The Living Archive</span><h1>{title}</h1></div>
        <p>{subtitle}</p>
      </header>
      <div className="reading-perspective">
        <div className="reading-book" aria-label={title}>
          <section className="reading-page reading-page-left">
            <div className="reading-page-heading">{eyebrow}</div>
            {left}
          </section>
          <div className="reading-spine" aria-hidden="true" />
          <section className="reading-page reading-page-right">{right}</section>
        </div>
      </div>
      {footer && <div className="reading-footer">{footer}</div>}
    </main>
  )
}
