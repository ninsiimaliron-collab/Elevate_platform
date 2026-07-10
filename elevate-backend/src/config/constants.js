const ROLES = {
  YOUTH: 'youth',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};

const KAMPALA_DIVISIONS = ['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'];

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'apprenticeship', 'contract', 'volunteer'];

const EDUCATION_LEVELS = ['none', 'certificate', 'diploma', 'bachelors', 'masters', 'phd', 'vocational'];

const RESOURCE_CATEGORIES = ['mentorship', 'free_courses', 'resume_tips', 'career_advice', 'skills_training'];

const EMPLOYER_INDUSTRIES = ['technology', 'construction', 'healthcare', 'education', 'finance', 'retail', 'hospitality', 'manufacturing', 'logistics', 'other'];

const APPLICATION_STATUSES = ['pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const UGANDA_PHONE_REGEX = /^(\+256|0)(7[0-9])\d{7}$/;

module.exports = {
  ROLES,
  KAMPALA_DIVISIONS,
  JOB_TYPES,
  EDUCATION_LEVELS,
  RESOURCE_CATEGORIES,
  EMPLOYER_INDUSTRIES,
  APPLICATION_STATUSES,
  PASSWORD_REGEX,
  UGANDA_PHONE_REGEX
};
