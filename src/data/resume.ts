/** Resume content, kept in sync with public/resume.txt. No phone number on the public site. */
export const RESUME = {
  name: 'Makenna Peters',
  headline: 'Full-Stack Software Engineer · Fargo, ND (remote)',
  summary:
    'Full-stack software engineer with 5+ years of experience building and maintaining scalable SaaS web applications using Ruby on Rails, React, JavaScript and PostgreSQL, with additional experience in Python/Django. Experienced in developing CMS platforms and internal tools, working in Agile environments, collaborating across cross-functional teams, and supporting production applications used by thousands of users. A fast learner who adapts quickly to new technologies, frameworks and environments.',
  experience: [
    {
      company: 'Finalsite',
      location: 'remote from Fargo, ND',
      roles: [
        { title: 'Software Engineer II', dates: 'Mar 2024 – May 2026' },
        { title: 'Software Engineer I', dates: 'Mar 2022 – Mar 2024' },
      ],
      bullets: [
        "Developed full-stack features for Composer, Finalsite's CMS platform used by thousands of K-12 schools, across modern Ruby on Rails services and legacy ColdFusion applications",
        'Implemented frontend features using React, JavaScript, Backbone/Marionette and jQuery, improving CMS usability and administrative workflows',
        'Built and enhanced backend functionality and RESTful APIs using Ruby on Rails and PostgreSQL to support content publishing, permissions management and administrative workflows',
        'Led end-to-end development of key platform initiatives, including a reCAPTCHA integration for form security and a self-service tool for migrating legacy calendar workflows',
        'Created and maintained unit and integration tests using RSpec and Jasmine, improving reliability and supporting CI/CD workflows',
        'Participated in Agile/Scrum: backlog refinement, story estimation, sprint planning and cross-functional collaboration',
        'Monitored and resolved production issues using Google Cloud Platform, New Relic and DataDog, improving stability and performance',
      ],
    },
    {
      company: 'PS Industries',
      location: 'Grand Forks, ND',
      roles: [{ title: 'Computer Science Intern', dates: 'May 2020 – Jun 2021' }],
      bullets: [
        'Developed full-stack web applications using Python, Django, JavaScript, HTML/CSS and jQuery to support internal business operations',
        'Independently built internal tools, including an employee time-tracking system and an HR workflow application for job position requests',
      ],
    },
  ],
  education: {
    degree: 'B.S. Computer Science',
    school: 'University of North Dakota',
    dates: '2017 – 2021',
    notes: 'GPA 4.0/4.0 · Minor in Mathematics',
  },
  skills: [
    { label: 'Languages', items: 'Ruby, JavaScript, TypeScript, Python, HTML, CSS, SQL, ColdFusion' },
    { label: 'Frameworks', items: 'Ruby on Rails, React, Django, Backbone.js, Marionette.js, jQuery' },
    { label: 'Testing', items: 'RSpec, Jasmine, Vitest, Playwright' },
    { label: 'Databases', items: 'PostgreSQL, MongoDB' },
    { label: 'Tools', items: 'Git, GitLab, Jira, Docker/Kubernetes, GCP, DataDog, New Relic' },
    { label: 'AI tools', items: 'Claude Code, GitHub Copilot, Cursor' },
  ],
};
