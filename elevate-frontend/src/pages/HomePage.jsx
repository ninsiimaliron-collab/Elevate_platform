import { Link } from 'react-router-dom';

const metrics = [
  { label: 'Verified Employers', value: '120+' },
  { label: 'Youth Placements', value: '3,400+' },
  { label: 'Career Resources', value: '500+' }
];

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="hero-grid">
        <article className="hero-panel">
          <p className="eyebrow">Kampala-first. Youth-centered.</p>
          <h1>Launch your career with trusted opportunities in Uganda.</h1>
          <p className="hero-copy">
            Elevate connects skilled young people to verified employers, jobs, and practical growth
            resources.
          </p>
          <div className="cta-row">
            <Link className="button" to="/jobs">
              Explore Jobs
            </Link>
            <Link className="button button-outline" to="/resources">
              Learn Skills
            </Link>
          </div>
        </article>

        <article className="card highlight-card">
          <h2>Why Elevate?</h2>
          <ul className="check-list">
            <li>Employer verification workflow for safer hiring.</li>
            <li>Youth profile and CV support designed for real hiring teams.</li>
            <li>Career resources curated for local market relevance.</li>
          </ul>
        </article>
      </div>

      <section className="metric-grid" aria-label="Platform metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="card metric-card">
            <p className="metric-value">{metric.value}</p>
            <p className="metric-label">{metric.label}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
