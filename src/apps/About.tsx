import { LINKS } from '../data/apps';
import type { AppProps } from './registry';

export function About({ onOpenApp }: AppProps) {
  return (
    <div className="app about">
      <header className="about-hero">
        <div className="about-avatar" aria-hidden="true">
          MP
        </div>
        <div>
          <p className="about-hello">Hi, I&apos;m Makenna (Mak) 👋</p>
          <p className="about-role">Full-stack software engineer · Ruby on Rails, React, TypeScript</p>
          <p className="about-location">Fargo, ND · open to remote roles</p>
        </div>
      </header>

      <p>
        I&apos;ve spent 5+ years building SaaS products, most recently at <strong>Finalsite</strong>, where I worked on
        Composer, the CMS used by thousands of K-12 schools. I build across the stack: Rails services and REST APIs on
        PostgreSQL, React front ends, and the tests and monitoring that keep them healthy in production.
      </p>
      <p>
        I&apos;m looking for a <strong>remote full-stack or Rails role</strong>, and I&apos;m especially interested in
        EdTech.
      </p>

      <div className="about-actions">
        <button type="button" className="btn btn-primary" onClick={() => onOpenApp('resume')}>
          Open my resume
        </button>
        <button type="button" className="btn" onClick={() => onOpenApp('projects')}>
          See projects
        </button>
        <button type="button" className="btn" onClick={() => onOpenApp('contact')}>
          Get in touch
        </button>
      </div>

      <fieldset className="groupbox">
        <legend>Highlights</legend>
        <ul className="checklist">
          <li>Led a reCAPTCHA integration for school website forms, end to end</li>
          <li>Built a self-service tool for migrating legacy calendar workflows</li>
          <li>Shipped features across modern Rails services and a legacy ColdFusion codebase</li>
          <li>Wrote RSpec and Jasmine tests and resolved production issues with GCP, New Relic and DataDog</li>
          <li>B.S. in Computer Science, University of North Dakota, 4.0 GPA</li>
        </ul>
      </fieldset>

      <fieldset className="groupbox">
        <legend>About this site</legend>
        <p>
          makOS is a desktop OS I built from scratch in React and TypeScript. The window manager (drag, resize, focus
          order, minimize and maximize) uses plain pointer events and a Zustand store, with no window library. It is
          tested with Vitest and Playwright, checked with axe in CI, and every bit of it works from the keyboard.
        </p>
        <table className="shortcuts">
          <caption className="visually-hidden">Keyboard shortcuts</caption>
          <tbody>
            <tr>
              <th scope="row">
                <kbd>Arrow keys</kbd>
              </th>
              <td>Move between desktop icons</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd>Enter</kbd>
              </th>
              <td>Open the selected icon</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd>Esc</kbd>
              </th>
              <td>Close the active window</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd>Alt</kbd> + <kbd>Arrows</kbd>
              </th>
              <td>Move the active window</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Arrows</kbd>
              </th>
              <td>Resize the active window</td>
            </tr>
          </tbody>
        </table>
        <p>
          <a href={LINKS.repo} target="_blank" rel="noreferrer">
            Read the source on GitHub
          </a>
        </p>
      </fieldset>
    </div>
  );
}
