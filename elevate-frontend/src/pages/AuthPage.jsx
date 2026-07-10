import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const industries = [
  'technology',
  'construction',
  'healthcare',
  'education',
  'finance',
  'retail',
  'hospitality',
  'manufacturing',
  'logistics',
  'other'
];

export default function AuthPage() {
  const { login, logout, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('youth');
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    full_name: '',
    date_of_birth: '',
    company_name: '',
    industry: 'technology'
  });
  const [state, setState] = useState({ loading: false, error: '', success: '' });
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  useEffect(() => {
    if (retryAfterSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRetryAfterSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfterSeconds]);

  const extractRetryAfterSeconds = (err) => {
    const headers = err?.response?.headers || {};
    const retryAfter = headers['retry-after'];
    const rateLimitReset = headers['ratelimit-reset'] || headers['x-ratelimit-reset'];

    if (retryAfter) {
      const asNumber = Number.parseInt(retryAfter, 10);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        return asNumber;
      }

      const retryDateMs = Date.parse(retryAfter);
      if (!Number.isNaN(retryDateMs)) {
        const deltaSeconds = Math.ceil((retryDateMs - Date.now()) / 1000);
        if (deltaSeconds > 0) {
          return deltaSeconds;
        }
      }
    }

    if (rateLimitReset) {
      const resetRaw = Number.parseInt(rateLimitReset, 10);
      if (Number.isFinite(resetRaw) && resetRaw > 0) {
        // Handle both relative-seconds and absolute epoch-seconds values.
        if (resetRaw > 1_000_000_000) {
          const deltaSeconds = resetRaw - Math.floor(Date.now() / 1000);
          if (deltaSeconds > 0) {
            return deltaSeconds;
          }
        } else {
          return resetRaw;
        }
      }
    }

    return 60;
  };

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (retryAfterSeconds > 0) {
      setState({
        loading: false,
        error: `Too many attempts. Please wait ${retryAfterSeconds}s before trying again.`,
        success: ''
      });
      return;
    }
    
    // Prevent rapid successive submissions (debounce)
    const now = Date.now();
    if (now - lastSubmitTime < 1000) {
      setState({
        loading: false,
        error: 'Please wait a moment before trying again.',
        success: ''
      });
      return;
    }
    setLastSubmitTime(now);

    setState({ loading: true, error: '', success: '' });

    try {
      if (mode === 'login') {
        const loginData = await login(form.email, form.password);
        setRetryAfterSeconds(0);
        const authenticatedRole = loginData?.user?.role;
        if (authenticatedRole && authenticatedRole !== role) {
          logout();
          throw {
            response: {
              data: {
                message:
                  role === 'youth'
                    ? 'This account is an Employer account. Select Employer to continue.'
                    : 'This account is a Job Seeker account. Select Job Seeker to continue.'
              }
            }
          };
        }
        setState({ loading: false, error: '', success: 'Welcome back!' });
      } else {
        const payload = {
          email: form.email,
          password: form.password,
          phone: form.phone,
          role
        };

        if (role === 'youth') {
          payload.full_name = form.full_name;
          payload.date_of_birth = form.date_of_birth;
        }

        if (role === 'employer') {
          payload.company_name = form.company_name;
          payload.industry = form.industry;
        }

        await register(payload);
        setState({ loading: false, error: '', success: 'Account created successfully.' });
      }

      navigate('/dashboard');
    } catch (err) {
      const isRateLimited = err?.response?.status === 429;
      const waitSeconds = isRateLimited ? extractRetryAfterSeconds(err) : 0;

      if (isRateLimited) {
        setRetryAfterSeconds(waitSeconds);
      }

      const backendErrors = err?.response?.data?.errors;
      const errorDetails = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.map((item) => `${item.field || 'error'}: ${item.message}`).join(' | ')
        : null;

      const errorMsg = isRateLimited
        ? `Too many authentication attempts. Please wait ${waitSeconds}s before trying again.`
        : errorDetails || err?.response?.data?.message || 'Authentication failed. Please try again.';

      setState({
        loading: false,
        error: errorMsg,
        success: ''
      });
      
      // Log rate limit errors for awareness
      if (isRateLimited) {
        console.warn('Rate limited on auth. Please wait before retrying.');
      }
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-split-background">
        <div className="auth-split-panel auth-split-panel--left">
          <div className="auth-split-overlay" />
          <div className="auth-copy">
            <p className="eyebrow">Elevate</p>
            <h2>Building Opportunities. Empowering Youth.</h2>
            <p>
              Elevate bridges the gap between young talent and real opportunities.
              Join a growing community of ambitious youth shaping their future through meaningful employment.
            </p>
          </div>
        </div>

        <div className="auth-split-panel auth-split-panel--right">
          <div className="auth-image-placeholder" aria-hidden="true">
            <div className="auth-image-card" />
          </div>
        </div>
      </div>

      <article className="card auth-card">
        <div className="auth-header">
          <img className="auth-logo" src="/favicon.svg" alt="Elevate logo" />
          <div>
            <span className="brand-kicker auth-brand-kicker">Elevate</span>
            <p className="auth-tagline">Youth Employment Platform</p>
          </div>
          <h1 className="auth-title">{mode === 'login' ? 'Sign in to Elevate' : 'Create your Elevate account'}</h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Access your dashboard, manage applications, and connect with opportunities.'
              : 'Join Elevate and find meaningful jobs, apprenticeships, and employer connections.'}
          </p>
        </div>

        <div className="toggle-row" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={`button ${mode === 'login' ? '' : 'button-outline'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`button ${mode === 'register' ? '' : 'button-outline'}`}
            onClick={() => setMode('register')}
          >
            Sign Up
          </button>
        </div>

        <div className="role-chooser" role="radiogroup" aria-label="Account role">
          <button
            type="button"
            role="radio"
            aria-checked={role === 'youth'}
            className={`button ${role === 'youth' ? '' : 'button-outline'}`}
            onClick={() => setRole('youth')}
          >
            Job Seeker
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={role === 'employer'}
            className={`button ${role === 'employer' ? '' : 'button-outline'}`}
            onClick={() => setRole('employer')}
          >
            Employer
          </button>
        </div>
        <p className="state-text role-help">
          {mode === 'login'
            ? 'Sign in using the role your account was created with.'
            : role === 'employer'
              ? 'Employers receive a default password after registration.'
              : 'Create a password for your account.'}
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </label>

          {mode === 'register' && role === 'youth' && (
            <label>
              Password
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 8 characters with uppercase, lowercase, number, and special character"
              />
            </label>
          )}

          {mode === 'login' && (
            <label>
              Password
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </label>
          )}

          {mode === 'register' && (
            <>
              <label>
                Phone
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+256701234567"
                />
              </label>

              {role === 'youth' ? (
                <>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => update('full_name', e.target.value)}
                    />
                  </label>
                  <label>
                    Date of Birth
                    <input
                      type="date"
                      required
                      value={form.date_of_birth}
                      onChange={(e) => update('date_of_birth', e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Company Name
                    <input
                      type="text"
                      required
                      value={form.company_name}
                      onChange={(e) => update('company_name', e.target.value)}
                    />
                  </label>
                  <label>
                    Industry
                    <select value={form.industry} onChange={(e) => update('industry', e.target.value)}>
                      {industries.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          )}

          <button className="button" type="submit" disabled={state.loading || retryAfterSeconds > 0}>
            {state.loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        {state.error ? <p className="state-text error">{state.error}</p> : null}
        {state.success ? <p className="state-text success">{state.success}</p> : null}
      </article>
    </section>
  );
}
