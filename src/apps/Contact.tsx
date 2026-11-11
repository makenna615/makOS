import { useState } from 'react';
import type { FormEvent } from 'react';
import { LINKS } from '../data/apps';

/** Static site, so the "send" form just builds a mailto: link. No backend, no tracking. */
export function Contact() {
  const [status, setStatus] = useState('');

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(LINKS.email);
      setStatus('Email address copied to clipboard.');
    } catch {
      setStatus(`Couldn't copy automatically. The address is ${LINKS.email}.`);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const subject = name ? `Hello from ${name} (via makOS)` : 'Hello from makOS';
    window.location.href = `mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="app contact">
      <p>The fastest way to reach me is email. I usually reply within a day.</p>

      <ul className="contact-list">
        <li>
          <span className="contact-label">Email</span>
          <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
          <button type="button" className="btn btn-small" onClick={copyEmail}>
            Copy
          </button>
        </li>
        <li>
          <span className="contact-label">LinkedIn</span>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
            in/makenna-peters
          </a>
        </li>
        <li>
          <span className="contact-label">GitHub</span>
          <a href={LINKS.github} target="_blank" rel="noreferrer">
            github.com/makenna615
          </a>
        </li>
      </ul>
      <p className="status-text" role="status">
        {status}
      </p>

      <fieldset className="groupbox">
        <legend>Write me a note</legend>
        <form className="contact-form" onSubmit={onSubmit}>
          <label htmlFor="contact-name">Your name</label>
          <input id="contact-name" name="name" autoComplete="name" />
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows={4} required />
          <button type="submit" className="btn btn-primary">
            Open in my email app
          </button>
        </form>
      </fieldset>
    </div>
  );
}
