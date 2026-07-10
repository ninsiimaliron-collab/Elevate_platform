import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, loading, verifyAccount } = useAuth();
  const [verificationState, setVerificationState] = useState({ loading: false, error: '', success: '' });
  const [activationCode, setActivationCode] = useState('');

  if (loading) {
    return <p className="state-text">Loading your profile...</p>;
  }

  if (!user) {
    return (
      <article className="card">
        <h2>You are not signed in</h2>
        <p>Please log in to view your profile and access personalized actions.</p>
        <Link className="button" to="/auth">
          Go to Login
        </Link>
      </article>
    );
  }

  const handleVerifyAccount = async () => {
    setVerificationState({ loading: true, error: '', success: '' });

    try {
      const data = await verifyAccount(activationCode);
      setVerificationState({
        loading: false,
        error: '',
        success: data?.alreadyVerified ? 'Your account is already verified.' : 'Profile verification completed.'
      });
      setActivationCode('');
    } catch (error) {
      setVerificationState({
        loading: false,
        error: error?.response?.data?.message || 'Failed to verify account.',
        success: ''
      });
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Your Account</h2>
        <p>Manage your profile and explore opportunities based on your role.</p>
      </div>

      <article className="card profile-card">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Verification:</strong> {user.is_verified ? 'Verified' : 'Pending'}
        </p>
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
        {user.role === 'youth' && !user.is_verified ? (
          <>
            <input
              type="password"
              className="input"
              placeholder="Enter your password as activation code"
              value={activationCode}
              onChange={(event) => setActivationCode(event.target.value)}
            />
            <button className="button button-outline" type="button" onClick={handleVerifyAccount} disabled={verificationState.loading || !activationCode.trim()}>
              {verificationState.loading ? 'Verifying...' : 'Activate Profile'}
            </button>
            {verificationState.error ? <p className="state-text error">{verificationState.error}</p> : null}
            {verificationState.success ? <p className="state-text success">{verificationState.success}</p> : null}
          </>
        ) : null}
      </article>
    </section>
  );
}
