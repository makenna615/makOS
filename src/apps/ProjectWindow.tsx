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
            id: 'engineering',
            label: 'Engineering',
            content: (
              <>
                <h4>Decisions I&apos;m proud of</h4>
                <ul className="bullets">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
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
