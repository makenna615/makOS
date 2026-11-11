/**
 * Resume content. Must match public/resume.pdf and public/resume.txt word for word
 * (all three come from "Makenna Peters Resume 2026"). No phone number on the public site.
 */
export const RESUME = {
  name: 'Makenna Peters',
  location: 'Fargo, ND',
  summary:
    'Full-stack software engineer with 4+ years of professional experience building SaaS web applications with Ruby on Rails, React, JavaScript, and PostgreSQL, plus earlier work in Python/Django. Most recently built and supported features for a CMS used by thousands of K–12 schools worldwide, often owning projects from planning through production.',
  experience: [
    {
      company: 'Finalsite',
      location: 'Remote from Fargo, ND',
      roles: [
        { title: 'Software Engineer II', dates: 'March 2024 – May 2026' },
        { title: 'Software Engineer I', dates: 'March 2022 – March 2024' },
      ],
      bullets: [
        'Built a self-service tool to move schools from the legacy ColdFusion Calendar module to the new Rails/React Calendar module. Sole developer for most of the project; cut customer migration timelines from years to months and reduced the need for Support involvement.',
        'Led the move from reCAPTCHA v2 to v3 across the Forms module and implemented invisible reCAPTCHA, stopping BlueSnap payment fields from loading on spam submissions and eliminating the unnecessary charges they caused.',
        'Automated the AudioEye accessibility setup, replacing a manual process of several steps per domain with a single self-service workflow. Reduced the process from several hours per school district to a few minutes.',
        'Developed full-stack features for Composer, Finalsite’s CMS, across Rails services and a legacy ColdFusion app, using React, JavaScript, and Backbone/Marionette on the frontend.',
        'Built REST APIs and backend features in Rails and PostgreSQL for content publishing, permissions, and admin workflows.',
        'Wrote RSpec and Jasmine tests for CI/CD and tracked down production issues using GCP, New Relic, and Datadog.',
        'Used Claude Code and GitHub Copilot day-to-day for planning work from Jira tickets, implementation, and merge request review.',
      ],
    },
    {
      company: 'PS Industries',
      location: 'Grand Forks, ND',
      roles: [{ title: 'Computer Science Intern', dates: 'May 2020 – June 2021' }],
      bullets: [
        'Built full-stack web apps with Python, Django, JavaScript, HTML/CSS, and jQuery for internal business operations.',
        'Independently built an employee time-tracking system and an HR app for managing job position requests.',
      ],
    },
  ],
  projects: [
    {
      name: 'AI Perfumery App',
      note: 'personal',
      stack: 'Next.js, React, TypeScript, OpenAI API',
      url: 'https://github.com/makenna615/perfume-app',
      urlLabel: 'github.com/makenna615/perfume-app',
      bullets: [
        'Finds similar fragrances, researches ingredients, and generates custom formulas tuned for balance, longevity, or projection. Used regularly for personal perfume making.',
        'Built mainly with Codex: planned features, broke work into tasks, and reviewed and tested the output, catching cases where it made wrong assumptions about APIs and data structures.',
      ],
    },
  ],
  education: {
    degree: 'B.S. Computer Science, Minor in Mathematics',
    school: 'University of North Dakota, Grand Forks, ND',
    dates: 'August 2017 – May 2021',
    notes: 'GPA: 4.0/4.0',
  },
  skills: [
    { label: 'Languages', items: 'Ruby, JavaScript, TypeScript, Python, SQL, HTML, CSS, ColdFusion' },
    {
      label: 'Frameworks',
      items: 'Ruby on Rails, React, Django, Backbone.js, Marionette.js, Next.js, jQuery, RSpec, Jasmine',
    },
    { label: 'Databases', items: 'PostgreSQL, MongoDB' },
    { label: 'Tools & Platforms', items: 'Git, GitLab, Jira, Docker, Kubernetes, GCP, Datadog, New Relic' },
    { label: 'AI Tools', items: 'Claude Code, GitHub Copilot, Codex' },
  ],
};
