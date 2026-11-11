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
          <p>{RESUME.headline}</p>
          <p className="paper-contact">
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <span aria-hidden="true"> · </span>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <span aria-hidden="true"> · </span>
            <a href={LINKS.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
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
              <div className="job-head">
                <p className="job-company">
                  <strong>{job.company}</strong>, {job.location}
                </p>
              </div>
              {job.roles.map((role) => (
                <div className="job-role" key={role.title}>
                  <span>{role.title}</span>
                  <span className="job-dates">{role.dates}</span>
                </div>
              ))}
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="resume-education">
          <h4 id="resume-education">Education</h4>
          <div className="job-role">
            <span>
              <strong>{RESUME.education.degree}</strong>, {RESUME.education.school}
            </span>
            <span className="job-dates">{RESUME.education.dates}</span>
          </div>
          <p>{RESUME.education.notes}</p>
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
