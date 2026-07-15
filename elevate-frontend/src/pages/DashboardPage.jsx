import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { applicationsApi, authApi, jobsApi, pickData, resourcesApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PasswordResetModal from '../components/PasswordResetModal';
import PostJobModal from '../components/PostJobModal';
import JobApplicantsModal from '../components/JobApplicantsModal';

const toArray = (value) => (Array.isArray(value) ? value : []);
const toNumber = (value) => Number(value || 0);

export default function DashboardPage() {
  const { user, loading, passwordResetRequired, verifyAccount } = useAuth();
  const [state, setState] = useState({ loading: true, error: '' });
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [listings, setListings] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState('all');
  const [selectedListingStatus, setSelectedListingStatus] = useState('all');
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [applicantsModalOpen, setApplicantsModalOpen] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [verificationState, setVerificationState] = useState({ loading: false, error: '', success: '' });
  const [activationCode, setActivationCode] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setState({ loading: false, error: '' });
        return;
      }

      setState({ loading: true, error: '' });

      try {
        const meRes = await authApi.me();
        const meData = pickData(meRes);
        setProfile(meData?.profile || null);

        if (user.role === 'youth') {
          const [appsRes, bookmarksRes] = await Promise.all([applicationsApi.my(), resourcesApi.myBookmarks()]);
          setApplications(toArray(pickData(appsRes)));
          setBookmarks(toArray(pickData(bookmarksRes)));
        }

        if (user.role === 'employer') {
          const listingsRes = await jobsApi.myListings();
          const employerListings = toArray(pickData(listingsRes));
          setListings(employerListings);

          const applicantGroups = await Promise.allSettled(
            employerListings.map(async (listing) => {
              const applicantsRes = await applicationsApi.jobApplicants(listing.id);
              return toArray(pickData(applicantsRes)).map((application) => ({
                ...application,
                job_id: listing.id,
                candidate_name: application.full_name || 'Candidate',
                job_title: listing.title,
                company_name: listing.company_name || profile?.company_name || 'Your company'
              }));
            })
          );

          const mergedApplicants = applicantGroups.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
          setRecentApplications(mergedApplicants);
        }

        setState({ loading: false, error: '' });
      } catch (error) {
        setState({
          loading: false,
          error: error?.response?.data?.message || 'Failed to load dashboard data.'
        });
      }
    };

    load();
  }, [user, profile?.company_name]);
  const handlePostJobSuccess = async () => {
    // Reload listings after job is posted
    try {
      const listingsRes = await jobsApi.myListings();
      const employerListings = toArray(pickData(listingsRes));
      setListings(employerListings);
    } catch (err) {
      console.error('Failed to reload listings after job posting:', {
        message: err?.response?.data?.message || err?.message,
        status: err?.response?.status
      });
      // UI continues to work; user can manually refresh if needed
    }
  };

  const handleApplicantStatusUpdate = async () => {
    // Reload recent applications after status change
    try {
      const listingsRes = await jobsApi.myListings();
      const employerListings = toArray(pickData(listingsRes));
      setListings(employerListings);

      const applicantGroups = await Promise.allSettled(
        employerListings.map(async (listing) => {
          const applicantsRes = await applicationsApi.jobApplicants(listing.id);
          return toArray(pickData(applicantsRes)).map((application) => ({
            ...application,
            job_id: listing.id,
            candidate_name: application.full_name || 'Candidate',
            job_title: listing.title,
            company_name: listing.company_name || profile?.company_name || 'Your company'
          }));
        })
      );

      const mergedApplicants = applicantGroups.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
      setRecentApplications(mergedApplicants);
    } catch (err) {
      console.error('Failed to reload applications after status update:', {
        message: err?.response?.data?.message || err?.message,
        status: err?.response?.status
      });
      // UI continues to work; user can manually refresh if needed
    }
  };

  const handleViewApplicants = (job) => {
    setSelectedJobForApplicants(job);
    setApplicantsModalOpen(true);
  };

  const canViewHiringPipeline = user?.role === 'employer';


  const seekerStats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((item) => item.status === 'accepted').length;
    const pending = applications.filter((item) => item.status === 'pending' || item.status === 'under_review').length;
    const shortlisted = applications.filter((item) => item.status === 'shortlisted').length;

    return { total, accepted, pending, shortlisted };
  }, [applications]);

  const seekerFullyVerified = user?.role === 'youth' && user?.is_verified && profile?.profile_complete;

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
        error: error?.response?.data?.message || 'Failed to send verification email.',
        success: ''
      });
    }
  };

  const employerStats = useMemo(() => {
    const total = listings.length;
    const active = listings.filter((item) => item.status === 'active').length;
    const draft = listings.filter((item) => item.status === 'draft').length;
    const totalApplicants = listings.reduce((sum, item) => sum + toNumber(item.application_count), 0);
    const shortlisted = recentApplications.filter((item) => item.status === 'shortlisted').length;
    const hired = recentApplications.filter((item) => item.status === 'accepted').length;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return { total, active, draft, totalApplicants, shortlisted, hired, activeRate };
  }, [listings, recentApplications]);

  const pipelineStats = useMemo(() => {
    const underReview = recentApplications.filter((item) => item.status === 'under_review').length;
    const shortlisted = recentApplications.filter((item) => item.status === 'shortlisted').length;
    const accepted = recentApplications.filter((item) => item.status === 'accepted').length;

    return {
      shortlisted,
      interview: underReview,
      offers: shortlisted,
      hired: accepted
    };
  }, [recentApplications]);

  const applicationStatusBreakdown = useMemo(() => {
    const buckets = [
      { key: 'pending', label: 'Pending', color: 'pending' },
      { key: 'under_review', label: 'Under Review', color: 'review' },
      { key: 'shortlisted', label: 'Shortlisted', color: 'shortlisted' },
      { key: 'accepted', label: 'Hired', color: 'accepted' }
    ];

    return buckets.map((bucket) => {
      const count = recentApplications.filter((item) => item.status === bucket.key).length;
      const total = recentApplications.length || 1;
      return {
        ...bucket,
        count,
        percent: Math.round((count / total) * 100)
      };
    });
  }, [recentApplications]);

  const filteredApplications = useMemo(() => {
    if (selectedApplicationStatus === 'all') {
      return recentApplications;
    }

    return recentApplications.filter((item) => item.status === selectedApplicationStatus);
  }, [recentApplications, selectedApplicationStatus]);

  const filteredListings = useMemo(() => {
    if (selectedListingStatus === 'all') {
      return listings;
    }

    return listings.filter((item) => item.status === selectedListingStatus);
  }, [listings, selectedListingStatus]);

  const activityTimeline = useMemo(() => {
    const listingEvents = listings.slice(0, 3).map((item) => ({
      id: `listing-${item.id}`,
      title: `Listing ${item.status === 'active' ? 'published' : 'updated'}`,
      text: item.title,
      time: item.created_at || null,
      tone: item.status === 'active' ? 'active' : 'draft'
    }));

    const applicationEvents = recentApplications.slice(0, 4).map((item) => ({
      id: `application-${item.id}`,
      title: `Application ${item.status}`,
      text: item.job_title || 'Untitled role',
      time: item.created_at || null,
      tone: item.status
    }));

    return [...applicationEvents, ...listingEvents]
      .sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0))
      .slice(0, 6);
  }, [listings, recentApplications]);

  if (loading || state.loading) {
    return <p className="state-text">Loading dashboard...</p>;
  }

  if (passwordResetRequired) {
    return <PasswordResetModal />;
  }

  if (!user) {
    return (
      <article className="card">
        <h2>Sign in to view your dashboard</h2>
        <p>Your dashboard is personalized for your role and account activity.</p>
        <Link className="button" to="/auth">
          Go to Login
        </Link>
      </article>
    );
  }

  if (state.error) {
    return <p className="state-text error">{state.error}</p>;
  }

  if (user.role === 'youth') {
    return (
      <section className="dashboard-page">
        <div className="section-head">
          <h2>Job Seeker Dashboard</h2>
          <p>Track your applications, visibility, and career resources in one place.</p>
        </div>

        <section className="metric-grid">
          <article className="card metric-card">
            <p className="metric-value">{seekerStats.total}</p>
            <p className="metric-label">Applications</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{seekerStats.pending}</p>
            <p className="metric-label">Pending/Review</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{seekerStats.shortlisted}</p>
            <p className="metric-label">Shortlisted</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{seekerStats.accepted}</p>
            <p className="metric-label">Accepted</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="card">
            <h3>Profile Readiness</h3>
            <p className="state-text">
              Profile completion status: <strong>{profile?.profile_complete ? 'Complete' : 'Incomplete'}</strong>
            </p>
            {!profile?.profile_complete ? (
              <Link className="button" to="/profile">
                Complete Profile
              </Link>
            ) : null}
          </article>

          <article className="card">
            <h3>Account Verification</h3>
            <div className="verification-badge">
              <span className={seekerFullyVerified ? 'badge-verified' : 'badge-pending'}>
                {seekerFullyVerified ? 'Verified and ready' : user?.is_verified ? 'Account verified, profile incomplete' : 'Activation pending'}
              </span>
            </div>
            <p className="state-text">
              Account status: <strong>{user?.is_verified ? 'Verified' : 'Pending'}</strong>
            </p>
            {!user?.is_verified ? (
              <>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password as activation code"
                  value={activationCode}
                  onChange={(event) => setActivationCode(event.target.value)}
                />
                <button className="button button-outline" onClick={handleVerifyAccount} disabled={verificationState.loading || !activationCode.trim()}>
                  {verificationState.loading ? 'Verifying...' : 'Activate Profile'}
                </button>
              </>
            ) : null}
            {verificationState.error ? <p className="state-text error">{verificationState.error}</p> : null}
            {verificationState.success ? <p className="state-text success">{verificationState.success}</p> : null}
          </article>

          <article className="card">
            <h3>Saved Resources</h3>
            <p className="state-text">You have {bookmarks.length} bookmarked career resources.</p>
            <ul className="compact-list">
              {bookmarks.slice(0, 4).map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
              {bookmarks.length === 0 ? <li>No bookmarks yet.</li> : null}
            </ul>
          </article>
        </section>

        <article className="card">
          <h3>Recent Applications</h3>
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{item.job_title}</td>
                    <td>{item.company_name}</td>
                    <td>
                      <span className="chip">{item.status}</span>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="3">No applications submitted yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    );
  }

  if (user.role === 'employer') {
    return (
      <section className="dashboard-page">
        <div className="section-head">
          <h2>Employer Dashboard</h2>
          <p>Manage listings, track hiring activity, and monitor response in real time.</p>

                <button className="button" onClick={() => setPostJobModalOpen(true)} style={{ marginBottom: '2rem' }}>
                  ➕ Post New Job
                </button>
        </div>

        {/* Quick Stats Grid */}
        <section className="metric-grid">
          <article className="card metric-card">
            <p className="metric-value">{employerStats.total}</p>
            <p className="metric-label">Total Listings</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{employerStats.active}</p>
            <p className="metric-label">Active Listings</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{employerStats.totalApplicants}</p>
            <p className="metric-label">Total Applicants</p>
          </article>
          <article className="card metric-card">
            <p className="metric-value">{employerStats.draft}</p>
            <p className="metric-label">Draft Listings</p>
          </article>
        </section>

        {/* Hiring Pipeline Overview (employer only) */}
        {canViewHiringPipeline ? (
          <section className="hiring-pipeline">
            <h3>Hiring Pipeline Overview</h3>
            <div className="pipeline-grid">
              <article className="pipeline-card">
                <div className="pipeline-number shortlisted">{pipelineStats.shortlisted}</div>
                <p>Shortlisted Candidates</p>
                <button type="button" className="pipeline-action" onClick={() => setSelectedApplicationStatus('shortlisted')}>
                  Review
                </button>
              </article>
              <article className="pipeline-card">
                <div className="pipeline-number interview">{pipelineStats.interview}</div>
                <p>Interview In Progress</p>
                <button type="button" className="pipeline-action" onClick={() => setSelectedApplicationStatus('under_review')}>
                  Update
                </button>
              </article>
              <article className="pipeline-card">
                <div className="pipeline-number offer">{pipelineStats.offers}</div>
                <p>Pending Acceptance</p>
                <button type="button" className="pipeline-action" onClick={() => setSelectedApplicationStatus('shortlisted')}>
                  Follow Up
                </button>
              </article>
              <article className="pipeline-card">
                <div className="pipeline-number hired">{pipelineStats.hired}</div>
                <p>Hired</p>
                <button type="button" className="pipeline-action" onClick={() => setSelectedApplicationStatus('accepted')}>
                  Onboard
                </button>
              </article>
            </div>
          </section>
        ) : null}

        <section className="dashboard-grid dashboard-grid-wide">
          <article className="card">
            <h3>📊 Listing Performance</h3>
            <div className="performance-list">
              <div className="performance-row">
                <span>Active Rate</span>
                <strong>{employerStats.activeRate}%</strong>
              </div>
              <div className="performance-row">
                <span>Draft Queue</span>
                <strong>{employerStats.draft}</strong>
              </div>
              <div className="performance-row">
                <span>Applicants per Listing</span>
                <strong>{employerStats.total > 0 ? Math.round(employerStats.totalApplicants / employerStats.total) : 0}</strong>
              </div>
              <div className="performance-row">
                <span>Shortlisted Pipeline</span>
                <strong>{employerStats.shortlisted}</strong>
              </div>
            </div>
            <div className="chart-block">
              <div className="chart-header">
                <span>Application Breakdown</span>
                <strong>{recentApplications.length} total</strong>
              </div>
              <div className="chart-bars">
                {applicationStatusBreakdown.map((item) => (
                  <div key={item.key} className="chart-row">
                    <div className="chart-labels">
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="chart-track">
                      <div className={`chart-fill ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="card">
            <h3>🎯 Priority Queue</h3>
            <ul className="priority-list">
              <li>Review your newest applications and mark the strongest candidates.</li>
              <li>Refresh draft listings so they can start collecting applicants.</li>
              <li>Follow up with shortlisted candidates before the opportunity cools off.</li>
              <li>Update company profile details to improve trust and visibility.</li>
            </ul>
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid-wide">
          <article className="card">
            <h3>🧲 Application Filters</h3>
            <div className="filter-row">
              {['all', 'pending', 'under_review', 'shortlisted', 'accepted'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-chip ${selectedApplicationStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedApplicationStatus(status)}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="card-description">Showing {filteredApplications.length} applications.</p>
          </article>

          <article className="card">
            <h3>🧱 Listing Filters</h3>
            <div className="filter-row">
              {['all', 'active', 'draft'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-chip ${selectedListingStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedListingStatus(status)}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
            <p className="card-description">Showing {filteredListings.length} job listings.</p>
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid-wide">
          <article className="card">
            <h3>👥 Candidate Snapshot</h3>
            <div className="candidate-snapshot">
              <div className="snapshot-item">
                <span className="snapshot-value">{employerStats.totalApplicants}</span>
                <span className="snapshot-label">All Applicants</span>
              </div>
              <div className="snapshot-item">
                <span className="snapshot-value">{employerStats.shortlisted}</span>
                <span className="snapshot-label">Shortlisted</span>
              </div>
              <div className="snapshot-item">
                <span className="snapshot-value">{employerStats.hired}</span>
                <span className="snapshot-label">Hired</span>
              </div>
            </div>
          </article>

          <article className="card">
            <h3>🧭 Next Best Actions</h3>
            <div className="next-actions">
              <Link className="button button-outline" to="/jobs">
                Publish a New Role
              </Link>
              <Link className="button button-outline" to="/resources">
                Read Hiring Tips
              </Link>
              <button className="button button-outline">Send Follow-up Message</button>
            </div>
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid-wide">
          <article className="card">
            <h3>🕒 Activity Timeline</h3>
            <div className="timeline-list">
              {activityTimeline.length > 0 ? (
                activityTimeline.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className={`timeline-dot ${item.tone}`} />
                    <div className="timeline-content">
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                      <span>{item.time ? new Date(item.time).toLocaleDateString() : 'Recent activity'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="state-text">No recent activity yet.</p>
              )}
            </div>
          </article>

          <article className="card">
            <h3>🚦 Talent Health</h3>
            <div className="health-grid">
              <div className="health-pill">
                <span>Hiring Speed</span>
                <strong>Fast</strong>
              </div>
              <div className="health-pill">
                <span>Response Level</span>
                <strong>{employerStats.activeRate}%</strong>
              </div>
              <div className="health-pill">
                <span>Open Roles</span>
                <strong>{employerStats.active}</strong>
              </div>
              <div className="health-pill">
                <span>Draft Backlog</span>
                <strong>{employerStats.draft}</strong>
              </div>
            </div>
          </article>
        </section>

        {/* Key Cards Section */}
        <section className="dashboard-grid">
          <article className="card">
            <h3>🏢 Company Profile</h3>
            <p className="state-text">
              Status: <strong>{profile?.registration_status || 'pending'}</strong>
            </p>
            <p className="card-description">Verified employers gain better candidate trust and visibility.</p>
            <Link className="button button-outline" to="/profile">
              View/Update Profile
            </Link>
          </article>

          <article className="card">
            <h3>📊 Verification Status</h3>
            <div className="verification-badge">
              <span className={profile?.registration_status === 'verified' ? 'badge-verified' : 'badge-pending'}>
                {profile?.registration_status === 'verified' ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>
            <p className="card-description">Complete verification to unlock premium features.</p>
          </article>

          <article className="card">
            <h3>⚡ Quick Actions</h3>
            <div className="quick-actions">
              <Link className="button" to="/jobs">
                ➕ Create Job Posting
              </Link>
              <Link className="button button-outline" to="/resources">
                📚 Browse Talent Resources
              </Link>
            </div>
          </article>

          <article className="card">
            <h3>⏰ Expiring Listings</h3>
            <p className="card-description">Keep your postings fresh with active listings.</p>
            <button className="button button-outline">View Expiring</button>
          </article>
        </section>

        {/* Featured Job Listings */}
        <article className="card featured-listings">
          <h3>📌 Featured Job Postings</h3>
          <div className="featured-jobs-grid">
            {listings.slice(0, 3).map((item) => (
              <div key={item.id} className="featured-job-card">
                <div className="job-title-section">
                  <h4>{item.title}</h4>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                </div>
                <div className="job-meta">
                  <span className="meta-badge">👥 {toNumber(item.application_count)} Applicants</span>
                  <span className="meta-badge">📍 {item.division || item.location_detail || 'Kampala'}</span>
                  <span className="meta-badge">💼 {item.job_type || 'Full-time'}</span>
                </div>
                <p className="job-description">{item.description?.substring(0, 80)}...</p>
                <div className="job-actions">
                  <button className="button small" onClick={() => handleViewApplicants(item)}>
                    👥 View Applicants
                  </button>
                  <button className="button-outline small" onClick={() => setPostJobModalOpen(true)}>
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ))}
            {listings.length === 0 && (
              <p className="state-text">No listings yet. Create your first job posting!</p>
            )}
          </div>
        </article>

        {/* Recent Applications */}
        <article className="card">
          <h3>🔔 Recent Applications</h3>
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{item.candidate_name || 'Candidate'}</td>
                    <td>{item.job_title}</td>
                    <td>
                      <span className="chip">{item.status}</span>
                    </td>
                    <td>
                      <button
                        className="button-text"
                        onClick={() => {
                          const matchedJob = listings.find((listing) => listing.id === item.job_id);
                          if (matchedJob) {
                            handleViewApplicants(matchedJob);
                          }
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="4">No recent applications.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {/* All Listings */}
        <article className="card">
          <h3>📋 My Job Listings</h3>
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.job_type || '—'}</td>
                    <td>
                      <span className="chip">{item.status}</span>
                    </td>
                    <td>{toNumber(item.application_count)}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn action-shortlisted"
                          onClick={() => handleViewApplicants(item)}
                        >
                          👥 View
                        </button>
                        {item.status === 'draft' && (
                          <button
                            className="action-btn action-accepted"
                            onClick={async () => {
                              try {
                                await jobsApi.publish(item.id);
                                await handlePostJobSuccess();
                              } catch (e) {
                                alert(e.response?.data?.message || 'Cannot publish: ' + e.message);
                              }
                            }}
                          >
                            ✅ Publish
                          </button>
                        )}
                        {item.status === 'active' && (
                          <button
                            className="action-btn action-rejected"
                            onClick={async () => {
                              try {
                                await jobsApi.close(item.id);
                                await handlePostJobSuccess();
                              } catch (e) {
                                alert(e.response?.data?.message || 'Failed to close job');
                              }
                            }}
                          >
                            🔒 Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan="4">No listings yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {/* Insights Section */}
        <section className="insights-section">
          <h3>📈 Hiring Insights</h3>

                  {/* Post Job Modal */}
                  <PostJobModal
                    isOpen={postJobModalOpen}
                    onClose={() => setPostJobModalOpen(false)}
                    onSuccess={handlePostJobSuccess}
                  />

                  {/* Job Applicants Modal */}
                  <JobApplicantsModal
                    isOpen={applicantsModalOpen}
                    onClose={() => setApplicantsModalOpen(false)}
                    job={selectedJobForApplicants}
                    onStatusUpdate={handleApplicantStatusUpdate}
                  />
          <div className="insights-grid">
            <article className="insight-card">
              <p className="insight-label">Response Rate</p>
              <p className="insight-value">78%</p>
              <p className="insight-subtext">Above average for your industry</p>
            </article>
            <article className="insight-card">
              <p className="insight-label">Avg. Time to Hire</p>
              <p className="insight-value">14 days</p>
              <p className="insight-subtext">Industry average: 18 days</p>
            </article>
            <article className="insight-card">
              <p className="insight-label">Application Quality</p>
              <p className="insight-value">Good</p>
              <p className="insight-subtext">Strong candidate pool</p>
            </article>
            <article className="insight-card">
              <p className="insight-label">Profile Strength</p>
              <p className="insight-value">90%</p>
              <p className="insight-subtext">Complete company details</p>
            </article>
          </div>
        </section>

        {/* Help & Resources */}
        <section className="help-section">
          <h3>💡 Tips & Resources</h3>
          <div className="tips-grid">
            <article className="tip-card">
              <h4>💬 Write Better Job Descriptions</h4>
              <p>Learn how to attract the right candidates with clear, engaging descriptions.</p>
              <button className="button-link">Learn More →</button>
            </article>
            <article className="tip-card">
              <h4>🎯 Screening Best Practices</h4>
              <p>Discover methods to identify top talent quickly and efficiently.</p>
              <button className="button-link">Learn More →</button>
            </article>
            <article className="tip-card">
              <h4>📞 Interview Questions Guide</h4>
              <p>Get sample questions tailored to different job roles.</p>
              <button className="button-link">Learn More →</button>
            </article>
          </div>
        </section>
      </section>
    );
  }

  return (
    <article className="card">
      <h2>Dashboard</h2>
      <p>Role-specific dashboard is currently available for youth and employer accounts.</p>
    </article>
  );
}
