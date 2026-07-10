import { Link } from 'react-router-dom';

const jobSeekerSteps = [
  {
    num: 1,
    title: 'Create Your Profile',
    description: 'Sign up as a job seeker. Add your CV, skills, education, and experience to build a strong profile.'
  },
  {
    num: 2,
    title: 'Explore Opportunities',
    description: 'Browse verified jobs filtered by location, industry, and career level. Read detailed job descriptions from real employers.'
  },
  {
    num: 3,
    title: 'Apply & Connect',
    description: 'Submit your application with a personalized cover letter. Track your application status in real time.'
  },
  {
    num: 4,
    title: 'Learn & Grow',
    description: 'Access career resources, interview prep guides, and mentorship while you wait to hear back.'
  },
  {
    num: 5,
    title: 'Land Your Role',
    description: 'Interview, negotiate, and join a verified employer. Start your new chapter with confidence.'
  }
];

const employerSteps = [
  {
    num: 1,
    title: 'Register & Verify',
    description: 'Create an employer account. Complete company verification for credibility and access to top talent.'
  },
  {
    num: 2,
    title: 'Post a Job',
    description: 'Create detailed job listings with salary, benefits, and requirements. Reach pre-qualified candidates.'
  },
  {
    num: 3,
    title: 'Review Applicants',
    description: 'Receive applications from skilled youth. Review profiles, CVs, and portfolios in one dashboard.'
  },
  {
    num: 4,
    title: 'Shortlist & Interview',
    description: 'Mark candidates as shortlisted. Schedule interviews and manage pipeline directly on the platform.'
  },
  {
    num: 5,
    title: 'Hire & Onboard',
    description: 'Extend offers and finalize hiring. Access onboarding resources to set your new hire up for success.'
  }
];

export default function HowItWorksPage() {
  return (
    <section>
      <div className="section-head" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>How Elevate Works</h1>
        <p>A simple, transparent process designed for both job seekers and employers.</p>
      </div>

      {/* Job Seeker Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-head">
          <h2>For Job Seekers</h2>
          <p>Find your next opportunity in 5 simple steps.</p>
        </div>

        <div className="steps-container">
          {jobSeekerSteps.map((step, idx) => (
            <div key={step.num} className="step-item">
              <div className="step-number">{step.num}</div>
              <article className="card step-card">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
              {idx < jobSeekerSteps.length - 1 && <div className="step-arrow">↓</div>}
            </div>
          ))}
        </div>

        <article className="card" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(15, 118, 110, 0.08)' }}>
          <h3>✨ Pro Tips for Job Seekers</h3>
          <ul style={{ margin: '1rem 0 0 1rem', color: 'var(--muted)', display: 'grid', gap: '0.5rem' }}>
            <li>Complete 100% of your profile for better job matches.</li>
            <li>Use keywords from job descriptions in your CV.</li>
            <li>Personalize your cover letter for each application.</li>
            <li>Check career resources regularly to improve interview skills.</li>
            <li>Follow up on shortlisted positions after one week.</li>
          </ul>
        </article>
      </section>

      {/* Employer Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-head">
          <h2>For Employers</h2>
          <p>Hire top talent in 5 streamlined steps.</p>
        </div>

        <div className="steps-container">
          {employerSteps.map((step, idx) => (
            <div key={step.num} className="step-item">
              <div className="step-number">{step.num}</div>
              <article className="card step-card">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
              {idx < employerSteps.length - 1 && <div className="step-arrow">↓</div>}
            </div>
          ))}
        </div>

        <article className="card" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(15, 118, 110, 0.08)' }}>
          <h3>🎯 Pro Tips for Employers</h3>
          <ul style={{ margin: '1rem 0 0 1rem', color: 'var(--muted)', display: 'grid', gap: '0.5rem' }}>
            <li>Write detailed job descriptions with clear requirements and benefits.</li>
            <li>Respond to shortlisted candidates within 2-3 days.</li>
            <li>Use the candidate profiles to assess cultural fit and potential.</li>
            <li>Provide interview feedback to improve candidate experience.</li>
            <li>Update your company profile regularly to build trust.</li>
          </ul>
        </article>
      </section>

      {/* Features Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-head">
          <h2>Key Platform Features</h2>
          <p>Tools built for success at every stage.</p>
        </div>

        <div className="features-grid">
          <article className="card feature-card">
            <p className="feature-icon">🔍</p>
            <h3>Smart Job Matching</h3>
            <p>Algorithm-powered matches based on skills, location, and career goals.</p>
          </article>

          <article className="card feature-card">
            <p className="feature-icon">✅</p>
            <h3>Verified Employers</h3>
            <p>All employers go through our verification process to ensure legitimacy.</p>
          </article>

          <article className="card feature-card">
            <p className="feature-icon">📊</p>
            <h3>Dashboard Management</h3>
            <p>Track applications, listings, and hiring progress from one place.</p>
          </article>

          <article className="card feature-card">
            <p className="feature-icon">📚</p>
            <h3>Career Resources</h3>
            <p>500+ guides, articles, and mentorship programs to support growth.</p>
          </article>

          <article className="card feature-card">
            <p className="feature-icon">💬</p>
            <h3>Direct Communication</h3>
            <p>Message employers and candidates securely within the platform.</p>
          </article>

          <article className="card feature-card">
            <p className="feature-icon">🛡️</p>
            <h3>Safe & Secure</h3>
            <p>Encrypted messaging, verified profiles, and fraud detection.</p>
          </article>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-head">
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions.</p>
        </div>

        <div className="faq-grid">
          <article className="card faq-card">
            <h3>Is it free to use Elevate?</h3>
            <p>Yes! Elevate is free for job seekers. Employers have premium subscription options for advanced features and priority support.</p>
          </article>

          <article className="card faq-card">
            <h3>How long does the verification process take?</h3>
            <p>Employer verification typically takes 2-5 business days. We review company registration, team details, and job posting history.</p>
          </article>

          <article className="card faq-card">
            <h3>Can I apply to multiple jobs?</h3>
            <p>Absolutely! You can apply to as many jobs as you'd like. We recommend tailoring your application for each role.</p>
          </article>

          <article className="card faq-card">
            <h3>How do I report a suspicious job posting?</h3>
            <p>Use the "Report" button on any job listing. Our team reviews reports within 24 hours and takes action on fraudulent postings.</p>
          </article>

          <article className="card faq-card">
            <h3>Can I delete my profile?</h3>
            <p>Yes. You can deactivate your account anytime from your profile settings. Your data will be retained for 30 days before permanent deletion.</p>
          </article>

          <article className="card faq-card">
            <h3>What payment methods do employers accept?</h3>
            <p>We accept mobile money (MTN, Airtel), bank transfers, and international cards. Payment options vary by location.</p>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section>
        <article className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(13, 148, 136, 0.1))' }}>
          <h2>Ready to Get Started?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Join thousands of job seekers and employers who are transforming careers on Elevate.
          </p>
          <div className="cta-row" style={{ justifyContent: 'center' }}>
            <Link className="button" to="/auth">
              Sign Up Now
            </Link>
            <Link className="button button-outline" to="/jobs">
              Browse Jobs
            </Link>
          </div>
        </article>
      </section>
    </section>
  );
}
