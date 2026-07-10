import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Brand & About */}
        <section className="footer-section">
          <h4>Elevate</h4>
          <p>Connecting Ugandan youth to verified opportunities and career growth resources.</p>
          <div className="social-links">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">💼</a>
            <a href="#" aria-label="Instagram">📸</a>
          </div>
        </section>

        {/* For Job Seekers */}
        <section className="footer-section">
          <h4>For Job Seekers</h4>
          <ul>
            <li><Link to="/jobs">Browse Jobs</Link></li>
            <li><Link to="/resources">Career Resources</Link></li>
            <li><Link to="/auth">Sign Up</Link></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </section>

        {/* For Employers */}
        <section className="footer-section">
          <h4>For Employers</h4>
          <ul>
            <li><a href="#post-job">Post a Job</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#employer-guide">Hiring Guide</a></li>
            <li><a href="#contact">Contact Sales</a></li>
          </ul>
        </section>

        {/* Company */}
        <section className="footer-section">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </section>

        {/* Legal */}
        <section className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="mailto:hello@elevate.ug">Email Us</a></li>
          </ul>
        </section>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Elevate. All rights reserved.</p>
        <p>Made with 💚 for Uganda's future.</p>
      </div>
    </footer>
  );
}
