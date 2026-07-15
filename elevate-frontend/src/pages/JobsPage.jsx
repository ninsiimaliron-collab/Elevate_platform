import { useEffect, useState, useCallback } from 'react';
import { applicationsApi, jobsApi, pickData } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [coverLetterByJob, setCoverLetterByJob] = useState({});
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  const loadJobs = useCallback(async (searchKeyword = '') => {
    const searchTerm = searchKeyword || keyword;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [jobsRes, myAppsRes] = await Promise.all([
        jobsApi.list({ keyword: searchTerm || undefined }),
        user?.role === 'youth' ? applicationsApi.my() : Promise.resolve(null)
      ]);

      const data = pickData(jobsRes);
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
      setJobs(list);

      if (myAppsRes) {
        const myApps = pickData(myAppsRes);
        const appRows = Array.isArray(myApps?.data) ? myApps.data : Array.isArray(myApps) ? myApps : [];
        const appliedIds = appRows.map((item) => item.job_id).filter(Boolean);
        setAppliedJobIds(appliedIds);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(keyword);
  }, [user?.role, keyword, loadJobs]);

  const onSearch = (event) => {
    event.preventDefault();
    loadJobs();
  };

  const handleApply = async (jobId) => {
    if (!user) {
      setError('Please log in as a job seeker to apply.');
      return;
    }

    if (user.role !== 'youth') {
      setError('Only job seeker accounts can apply for jobs.');
      return;
    }

    setError('');
    setSuccess('');
    setApplyingJobId(jobId);
    try {
      const cover_letter = coverLetterByJob[jobId]?.trim();
      await applicationsApi.apply(jobId, cover_letter ? { cover_letter } : {});
      setAppliedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
      setExpandedJobId(null);
      setSuccess('Application submitted successfully. You can track it from your dashboard.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to apply for this job');
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Open Job Opportunities</h2>
        <form className="search-row" onSubmit={onSearch}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, skill, or keyword"
          />
          <button className="button" type="submit">
            Search
          </button>
        </form>
      </div>

      {loading ? <p className="state-text">Loading jobs...</p> : null}
      {error ? <p className="state-text error">{error}</p> : null}
      {success ? <p className="state-text" style={{ color: 'var(--ok)' }}>{success}</p> : null}

      <div className="card-grid">
        {!loading && jobs.length === 0 ? <p className="state-text">No jobs found right now.</p> : null}
        {jobs.map((job) => (
          <article key={job.id || job.slug} className="card job-card">
            <h3>{job.title}</h3>
            <p>{job.description || 'No description provided yet.'}</p>
            <div className="chip-row">
              <span className="chip">{job.job_type || 'N/A'}</span>
              <span className="chip">{job.division || 'Kampala'}</span>
              <span className="chip">{job.status || 'active'}</span>
            </div>

            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              {user?.role === 'youth' ? (
                <>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    disabled={appliedJobIds.includes(job.id)}
                  >
                    {appliedJobIds.includes(job.id)
                      ? 'Applied'
                      : expandedJobId === job.id
                        ? 'Hide Cover Letter'
                        : 'Apply Now'}
                  </button>

                  {expandedJobId === job.id ? (
                    <>
                      <textarea
                        value={coverLetterByJob[job.id] || ''}
                        onChange={(e) =>
                          setCoverLetterByJob((prev) => ({
                            ...prev,
                            [job.id]: e.target.value
                          }))
                        }
                        placeholder="Optional cover letter"
                        rows={4}
                        style={{ width: '100%', borderRadius: '0.8rem', border: '2px solid var(--border)', padding: '0.75rem' }}
                      />
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleApply(job.id)}
                        disabled={applyingJobId === job.id || appliedJobIds.includes(job.id)}
                      >
                        {appliedJobIds.includes(job.id)
                          ? 'Applied'
                          : applyingJobId === job.id
                            ? 'Applying...'
                            : 'Submit Application'}
                      </button>
                    </>
                  ) : null}
                </>
              ) : null}

              {!user ? <p className="state-text" style={{ margin: 0 }}>Log in as a job seeker to apply.</p> : null}
              {user && user.role !== 'youth' ? <p className="state-text" style={{ margin: 0 }}>Only job seeker accounts can apply.</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
