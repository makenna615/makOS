import { LINKS } from '../data/apps';
import { RESUME } from '../data/resume';

export function Resume() {
  return (
    <div className="app resume">
      <div className="toolbar" role="toolbar" aria-label="Resume actions">
        <a className="btn btn-primary" href={LINKS.resumePdf} download="Makenna-Peters-Resume.pdf">
          Download PDF
        </a>
        <a className="btn" href={LINKS.resumePdf} target="_blank" rel="noreferrer">
          Open PDF
        </a>
        <a className="btn" href={LINKS.resumeTxt} target="_blank" rel="noreferrer">
          Plain text
        </a>
      </div>

      <article className="paper" aria-label="Resume">
        <header className="paper-header">
          <h3>{RESUME.name}</h3>
          <p className="paper-contact">
            {RESUME.location}
            <span aria-hidden="true"> | </span>
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
          </p>
          <p className="paper-contact">
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
              linkedin.com/in/makenna-peters-6535b7196
            </a>
            <span aria-hidden="true"> | </span>
            <a href={LINKS.github} target="_blank" rel="noreferrer">
              github.com/makenna615
            </a>
            <span aria-hidden="true"> | </span>
            <a href={LINKS.site}>mak-os-portfolio.vercel.app</a>
          </p>
        </header>

        <section aria-labelledby="resume-summary">
          <h4 id="resume-summary">Summary</h4>
          <p>{RESUME.summary}</p>
        </section>

        <section aria-labelledby="resume-experience">
          <h4 id="resume-experience">Experience</h4>
          {RESUME.experience.map((job) => (
            <div className="job" key={job.company}>
              {job.roles.map((role) => (
                <div className="job-role" key={role.title}>
                  <strong>{role.title}</strong>
                  <strong className="job-dates">{role.dates}</strong>
                </div>
              ))}
              <p className="job-company">
                <em>{job.company}</em>, {job.location}
              </p>
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="resume-projects">
          <h4 id="resume-projects">Projects</h4>
          {RESUME.projects.map((proj) => (
            <div className="job" key={proj.name}>
              <p className="job-company">
                <strong>{proj.name}</strong>
                {proj.note && ` (${proj.note})`} | {proj.stack} |{' '}
                <a href={proj.url} target="_blank" rel="noreferrer">
                  {proj.urlLabel}
                </a>
              </p>
              <ul>
                {proj.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="resume-education">
          <h4 id="resume-education">Education</h4>
          <div className="job-role">
            <strong>{RESUME.education.degree}</strong>
            <strong className="job-dates">{RESUME.education.dates}</strong>
          </div>
          <div className="job-role">
            <em>{RESUME.education.school}</em>
            <span>{RESUME.education.notes}</span>
          </div>
        </section>

        <section aria-labelledby="resume-skills">
          <h4 id="resume-skills">Technical skills</h4>
          <dl className="skills">
            {RESUME.skills.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.items}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
}
