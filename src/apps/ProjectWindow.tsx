import { Tabs } from '../components/Tabs';
import { PROJECTS, type Project } from '../data/projects';

export function ProjectWindow({ projectId }: { projectId: Project['id'] }) {
  const p = PROJECTS[projectId];

  return (
    <div className="app project">
      <header className="project-header">
        <h3>{p.name}</h3>
        <p className="project-tagline">{p.tagline}</p>
        <p className="project-status">{p.status}</p>
      </header>

      <Tabs
        label={`${p.name} details`}
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <>
                <img
                  className="project-hero"
                  src={p.hero.src}
                  alt={p.hero.alt}
                  width={p.hero.width}
                  height={p.hero.height}
                  decoding="async"
                />
                {p.overview.map((para) => (
                  <p key={para}>{para}</p>
                ))}
                {p.pipeline && (
                  <>
                    <h4>{p.pipeline.title}</h4>
                    <ol className="pipeline">
                      {p.pipeline.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </>
                )}
              </>
            ),
          },
          {
            id: 'features',
            label: 'Features',
            content: (
              <div className="feature-groups">
                {p.features.map((g) => (
                  <section key={g.group} aria-label={g.group}>
                    <h4>{g.group}</h4>
                    <ul className="checklist">
                      {g.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ),
          },
          {
            id: 'screenshots',
            label: 'Screenshots',
            content: (
              <>
                <p className="gallery-hint">Select a screenshot to open it full size.</p>
                <ul className="gallery">
                  {p.screenshots.map((s) => (
                    <li key={s.src}>
                      <figure className={s.mobile ? 'gallery-item is-mobile' : 'gallery-item'}>
                        <a className="gallery-link" href={s.src} target="_blank" rel="noreferrer">
                          {/* Lazy: thumbnails only download once this tab is shown. */}
                          <img
                            src={s.thumb}
                            alt={s.alt}
                            width={s.mobile ? 360 : 640}
                            height={s.mobile ? 640 : 400}
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="visually-hidden"> (opens full size in a new tab)</span>
                        </a>
                        <figcaption>{s.caption}</figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              </>
            ),
          },
          {
            id: 'engineering',
            label: 'Engineering',
            content: (
              <>
                <h4>Decisions I&apos;m proud of</h4>
                {p.highlights.map((group, i) => (
                  <section key={group.title ?? i} aria-label={group.title}>
                    {group.title && <h5 className="highlight-title">{group.title}</h5>}
                    <ul className="bullets">
                      {group.items.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </section>
                ))}
                <h4>Tech stack</h4>
                <table className="stack-table">
                  <tbody>
                    {p.stack.map((row) => (
                      <tr key={row.layer}>
                        <th scope="row">{row.layer}</th>
                        <td>{row.tech}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ),
          },
          {
            id: 'links',
            label: 'Links',
            content: (
              <ul className="link-list">
                {p.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a className="btn" href={l.href} target="_blank" rel="noreferrer">
                        {l.label}
                      </a>
                    ) : (
                      <span className="btn is-disabled" aria-disabled="true">
                        {l.label}
                      </span>
                    )}
                    {l.note && <span className="link-note">{l.note}</span>}
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </div>
  );
}
