import { useEffect, useState } from 'react';
import { pickData, resourcesApi } from '../lib/api';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Resources', icon: '📚' },
    { id: 'career_advice', label: 'Career Advice', icon: '💼' },
    { id: 'skill_development', label: 'Skill Development', icon: '🎯' },
    { id: 'interview_prep', label: 'Interview Prep', icon: '🎤' },
    { id: 'mentorship', label: 'Mentorship', icon: '👥' },
    { id: 'tools_guides', label: 'Tools & Guides', icon: '🛠️' }
  ];

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await resourcesApi.list();
        const data = pickData(res);
        setResources(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section>
      <div className="section-head">
        <h2>Career Growth Resources</h2>
        <p>Mentorship, skills, and practical guidance for youth career acceleration.</p>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <h4>500+</h4>
          <p>Quality Resources</p>
        </div>
        <div className="stat-card">
          <h4>50K+</h4>
          <p>Active Learners</p>
        </div>
        <div className="stat-card">
          <h4>95%</h4>
          <p>User Satisfaction</p>
        </div>
        <div className="stat-card">
          <h4>24/7</h4>
          <p>Self-Paced Learning</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search resources by title or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <h3>Browse by Category</h3>
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Resources Grid */}
      <div className="resources-section">
        <h3>
          {selectedCategory === 'all' ? 'All Resources' : `${categories.find(c => c.id === selectedCategory)?.label || 'Resources'}`}
          {filteredResources.length > 0 && <span className="count">({filteredResources.length})</span>}
        </h3>

        {loading ? <p className="state-text">Loading resources...</p> : null}
        {error ? <p className="state-text error">{error}</p> : null}

        {!loading && filteredResources.length === 0 && resources.length > 0 ? (
          <p className="state-text">No resources found. Try a different search or category.</p>
        ) : null}

        {!loading && resources.length === 0 ? (
          <p className="state-text">No published resources available yet.</p>
        ) : null}

        <div className="card-grid">
          {filteredResources.map((resource) => (
            <article key={resource.id || resource.slug} className="card resource-card">
              <div className="resource-header">
                <h3>{resource.title}</h3>
                <span className="resource-views">👁️ {resource.views_count || 0}</span>
              </div>
              <p>{resource.description || 'No description provided yet.'}</p>
              <div className="chip-row">
                <span className="chip">{resource.category || 'career_advice'}</span>
              </div>
              <button className="button-outline">View Resource</button>
            </article>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h3>Want to Share Your Knowledge?</h3>
        <p>Help other job seekers by contributing your own resources and insights.</p>
        <button className="button">Become a Resource Contributor</button>
      </div>
    </section>
  );
}
