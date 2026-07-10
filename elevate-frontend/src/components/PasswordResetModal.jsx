import { useState } from 'react';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function PasswordResetModal() {
  const { clearPasswordResetRequired } = useAuth();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '', success: '' });

    if (form.newPassword !== form.confirmPassword) {
      setState({ loading: false, error: 'Passwords do not match', success: '' });
      return;
    }

    if (form.newPassword.length < 8) {
      setState({ loading: false, error: 'Password must be at least 8 characters', success: '' });
      return;
    }

    try {
      await authApi.changePassword({ newPassword: form.newPassword });
      setState({ loading: false, error: '', success: 'Password changed successfully!' });
      setTimeout(() => {
        clearPasswordResetRequired();
      }, 1000);
    } catch (err) {
      setState({
        loading: false,
        error: err?.response?.data?.message || 'Failed to change password. Please try again.',
        success: ''
      });
    }
  };

  return (
    <div className="modal-overlay">
      <article className="modal-content password-reset-modal">
        <div className="modal-header">
          <h2>Set Your Password</h2>
          <p>You're using a default password. Please create a new password to secure your account.</p>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            New Password
            <input
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => update('newPassword', e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
            />
          </label>

          <button className="button" type="submit" disabled={state.loading}>
            {state.loading ? 'Setting password...' : 'Set Password'}
          </button>
        </form>

        {state.error ? <p className="state-text error">{state.error}</p> : null}
        {state.success ? <p className="state-text success">{state.success}</p> : null}
      </article>
    </div>
  );
}
