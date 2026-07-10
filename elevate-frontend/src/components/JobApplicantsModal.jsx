import { useState, useEffect } from 'react';
import { API_URL, applicationsApi, pickData } from '../lib/api';

const statusColors = {
  pending: '#f97316',
  under_review: '#3b82f6',
  shortlisted: '#8b5cf6',
  accepted: '#22c55e',
  rejected: '#ef4444'
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

const toAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
};

export default function JobApplicantsModal({ isOpen, onClose, job, onStatusUpdate }) {
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (isOpen && job) {
      fetchApplicants('load');
    }
  }, [isOpen, job]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccess('');
    }, 2500);

    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredApplicants(applicants);
    } else {
      setFilteredApplicants(applicants.filter((app) => app.status === selectedStatus));
    }
  }, [applicants, selectedStatus]);

  const fetchApplicants = async (source = 'refresh') => {
    setLoading(true);
    setError('');
    try {
      const previousCount = applicants.length;
      const res = await applicationsApi.jobApplicants(job.id);
      const data = pickData(res);
      const nextApplicants = Array.isArray(data) ? data : [];
      setApplicants(nextApplicants);

      if (source === 'refresh') {
        const delta = nextApplicants.length - previousCount;
        if (delta > 0) {
          setSuccess(`${delta} new applicant${delta > 1 ? 's' : ''} found.`);
        } else {
          setSuccess('Applicants refreshed.');
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load applicants';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    try {
      await applicationsApi.updateStatus(applicationId, newStatus);
      
      // Update local state
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusActions = {
    pending: ['under_review', 'shortlisted', 'accepted', 'rejected'],
    under_review: ['shortlisted', 'accepted', 'rejected'],
    shortlisted: ['accepted', 'rejected'],
    accepted: [],
    rejected: []
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString();
  };

  const formatSkills = (value) => {
    if (!value) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.join(', ') : value;
      } catch {
        return value;
      }
    }
    return 'N/A';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Applicants for: {job?.title}</h2>
            <p className="modal-subtitle">Total: {applicants.length} applicants</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <p className="state-text success" style={{ marginBottom: '0.75rem' }}>{success}</p>}

        {/* Status Filter */}
        <div className="applicants-filters">
          <button
            className={`filter-chip ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All ({applicants.length})
          </button>
          {Object.entries(statusLabels).map(([key, label]) => {
            const count = applicants.filter((a) => a.status === key).length;
            return (
              <button
                key={key}
                className={`filter-chip ${selectedStatus === key ? 'active' : ''}`}
                onClick={() => setSelectedStatus(key)}
                style={{ '--chip-color': statusColors[key] }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Applicants List */}
        <div className="applicants-list">
          {loading ? (
            <p className="loading-text">Loading applicants...</p>
          ) : filteredApplicants.length === 0 ? (
            <p className="empty-text">No applicants found</p>
          ) : (
            filteredApplicants.map((applicant) => (
              <div key={applicant.id} className="applicant-card">
                <div className="applicant-info">
                  <div className="applicant-header">
                    <div>
                      <h3>{applicant.full_name || 'N/A'}</h3>
                      <p className="applicant-email">{applicant.email || 'Hidden until shortlisted'}</p>
                    </div>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: statusColors[applicant.status] }}
                    >
                      {statusLabels[applicant.status]}
                    </span>
                  </div>

                  <div className="applicant-meta">
                    <p>📅 Applied: {formatDateTime(applicant.applied_at)}</p>
                    <p>🎓 Education: {applicant.education_level || 'N/A'}</p>
                    <p>🧠 Skills: {formatSkills(applicant.skills)}</p>
                    <p>📞 Phone: {applicant.phone || 'Hidden until shortlisted'}</p>
                    <p>
                      📄 CV:{' '}
                      {applicant.cv_url ? (
                        <a href={toAssetUrl(applicant.cv_url)} target="_blank" rel="noreferrer">
                          View CV
                        </a>
                      ) : (
                        'Not uploaded'
                      )}
                    </p>
                    {applicant.cover_letter && (
                      <p className="cover-letter-preview">
                        💬 Cover Letter: "{applicant.cover_letter}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="applicant-actions">
                  {statusActions[applicant.status]?.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      className={`action-btn action-${nextStatus}`}
                      onClick={() => handleStatusChange(applicant.id, nextStatus)}
                      disabled={updatingId === applicant.id}
                    >
                      {nextStatus === 'under_review' && '👁️ Review'}
                      {nextStatus === 'shortlisted' && '⭐ Shortlist'}
                      {nextStatus === 'accepted' && '✅ Accept'}
                      {nextStatus === 'rejected' && '❌ Reject'}
                    </button>
                  ))}
                  {statusActions[applicant.status]?.length === 0 && (
                    <p className="no-actions">No actions available</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="button button-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="button" onClick={() => fetchApplicants('refresh')} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
