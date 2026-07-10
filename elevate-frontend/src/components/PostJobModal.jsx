import { useState, useEffect } from 'react';
import { jobsApi, pickData } from '../lib/api';

export default function PostJobModal({ isOpen, onClose, onSuccess, editingJob = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_detail: '',
    division: '',
    salary_min: '',
    salary_max: '',
    job_type: 'full-time',
    requirements: '',
    application_deadline: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingJob) {
      setFormData({
        title: editingJob.title || '',
        description: editingJob.description || '',
        location_detail: editingJob.location_detail || '',
        division: editingJob.division || '',
        salary_min: editingJob.salary_min || '',
        salary_max: editingJob.salary_max || '',
        job_type: editingJob.job_type || 'full-time',
        requirements: editingJob.requirements || '',
        application_deadline: editingJob.application_deadline ? editingJob.application_deadline.substring(0, 10) : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location_detail: '',
        division: '',
        salary_min: '',
        salary_max: '',
        job_type: 'full-time',
        requirements: '',
        application_deadline: ''
      });
    }
    setError('');
  }, [editingJob, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.description) {
        setError('Title and description are required');
        setLoading(false);
        return;
      }

      if (editingJob) {
        await jobsApi.update(editingJob.id, formData);
      } else {
        const res = await jobsApi.create(formData);
        const created = pickData(res);
        // Auto-publish if deadline is set and backend allows it
        if (created?.id) {
          try {
            await jobsApi.publish(created.id);
          } catch (publishErr) {
            // Publish may fail if employer is not yet verified
            console.warn('Job created but publish failed:', publishErr?.response?.data?.message);
            setError('Job created as draft. Publishing may require account verification.');
            setLoading(false);
            return;
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to save job';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingJob ? 'Edit Job Posting' : 'Create New Job'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="job-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Software Engineer"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location_detail">Location Detail</label>
              <input
                id="location_detail"
                type="text"
                name="location_detail"
                value={formData.location_detail}
                onChange={handleChange}
                placeholder="e.g., Industrial Area, Jinja Road"
              />
            </div>
            <div className="form-group">
              <label htmlFor="division">Division *</label>
              <select id="division" name="division" value={formData.division} onChange={handleChange} required>
                <option value="">Select Division</option>
                <option value="Central">Central</option>
                <option value="Kawempe">Kawempe</option>
                <option value="Makindye">Makindye</option>
                <option value="Nakawa">Nakawa</option>
                <option value="Rubaga">Rubaga</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="job_type">Job Type</label>
              <select id="job_type" name="job_type" value={formData.job_type} onChange={handleChange}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="apprenticeship">Apprenticeship</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Salary Range (UGX)</label>
              <div className="salary-range">
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleChange}
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleChange}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, and key expectations..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Key Requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List required skills, experience, education..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="application_deadline">Application Deadline</label>
            <input
              id="application_deadline"
              type="date"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={handleChange}
            />
            <p className="help-text">Setting a deadline is required to publish the job.</p>
          </div>

          <div className="form-actions">
            <button type="button" className="button button-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
