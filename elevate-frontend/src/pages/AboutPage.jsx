import { Link } from 'react-router-dom';

const values = [
  {
    icon: '🎯',
    title: 'Youth-First',
    description: "We center young people's aspirations and create pathways to meaningful work."
  },
  {
    icon: '🤝',
    title: 'Trust & Transparency',
    description: 'Verified employers, honest job descriptions, and real feedback build confidence.'
  },
  {
    icon: '🚀',
    title: 'Growth Mindset',
    description: 'Beyond jobs—we provide resources, mentorship, and career guidance.'
  },
  {
    icon: '🌍',
    title: 'Local Impact',
    description: "Kampala-born platform designed for Uganda's unique opportunities and challenges."
  }
];

const team = [
  { name: 'Sarah Okonkwo', role: 'Co-Founder & CEO', bio: 'HR technologist with 8+ years in talent acquisition.' },
  { name: 'James Mwangi', role: 'Co-Founder & CTO', bio: 'Full-stack engineer passionate about accessible platforms.' },
  { name: 'Amina Sseninde', role: 'Head of Partnerships', bio: 'Community builder connecting employers and youth networks.' },
  { name: 'David Okello', role: 'Career Counselor Lead', bio: 'Educational background guiding resource strategy.' }
];

export default function AboutPage() {
  return (
    <section>
      <div className="hero-grid">
        <article className="hero-panel">
          <p className="eyebrow">Our Story</p>
          <h1>Elevating futures, one opportunity at a time.</h1>
          <p className="hero-copy">
            Elevate started with a simple belief: talented young Ugandans deserve jobs that match their
            potential. We're building a platform that bridges the gap between ambition and opportunity.
          </p>
          <div className="cta-row">
            <Link className="button" to="/jobs">
              Join Now
            </Link>
            <a className="button button-outline" href="mailto:hello@elevate.ug">
              Get in Touch
            </a>
          </div>
        </article>

        <article className="card highlight-card">
          <h2>Founded in 2024</h2>
          <p>Elevate emerged from research showing that 67% of Ugandan youth struggle to find verified, legitimate job opportunities that match their skills.</p>
          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.95rem' }}>
            Our mission: reduce jobless frustration, improve hiring quality, and make career growth accessible to everyone.
          </p>
        </article>
      </div>

      {/* Values Section */}
      <section style={{ margin: '3rem 0' }}>
        <div className="section-head">
          <h2>Our Values</h2>
          <p>What drives every decision we make at Elevate.</p>
        </div>
        <div className="card-grid">
          {values.map((value) => (
            <article key={value.title} className="card value-card">
              <p className="value-icon">{value.icon}</p>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section style={{ margin: '3rem 0' }}>
        <div className="section-head">
          <h2>Meet the Team</h2>
          <p>Passionate professionals dedicated to changing lives.</p>
        </div>
        <div className="team-grid">
          {team.map((member) => (
            <article key={member.name} className="card team-card">
              <div className="team-avatar">{member.name.charAt(0)}</div>
              <h3>{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-bio">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section style={{ margin: '3rem 0' }}>
        <div className="section-head">
          <h2>Our Impact</h2>
          <p>Measurable progress toward youth employment in Uganda.</p>
        </div>
        <div className="impact-grid">
          <article className="card impact-card">
            <p className="impact-stat">3,400+</p>
            <p>Youth Successfully Placed</p>
          </article>
          <article className="card impact-card">
            <p className="impact-stat">120+</p>
            <p>Verified Employers</p>
          </article>
          <article className="card impact-card">
            <p className="impact-stat">500+</p>
            <p>Career Resources</p>
          </article>
          <article className="card impact-card">
            <p className="impact-stat">98%</p>
            <p>Employer Satisfaction</p>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section style={{ margin: '3rem 0' }}>
        <article className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(13, 148, 136, 0.1))' }}>
          <h2>Ready to Start Your Journey?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Whether you're seeking opportunities or top talent, Elevate is here to help.
          </p>
          <div className="cta-row" style={{ justifyContent: 'center' }}>
            <Link className="button" to="/auth">
              Get Started
            </Link>
            <a className="button button-outline" href="mailto:hello@elevate.ug">
              Contact Us
            </a>
          </div>
        </article>
      </section>
    </section>
  );
}
