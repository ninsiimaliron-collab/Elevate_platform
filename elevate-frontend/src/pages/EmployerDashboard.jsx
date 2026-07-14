import { useState } from "react";

const DIVISIONS = [
  "Technology",
  "Construction",
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Hospitality",
  "Manufacturing",
  "Logistics",
  "Other",
];

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

const INITIAL_FORM = {
  jobTitle: "",
  locationDetail: "",
  division: "",
  jobType: "Full-time",
  salaryMin: "",
  salaryMax: "",
  jobDescription: "",
  keyRequirements: "",
  applicationDeadline: "",
};

const REQUIRED_FIELDS = ["jobTitle", "division", "jobDescription", "applicationDeadline"];

export default function CreateNewJobModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose?.();
  };

  const validate = () => {
    const nextErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!String(form[field]).trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      jobTitle: form.jobTitle.trim(),
      locationDetail: form.locationDetail.trim(),
      division: form.division,
      jobType: form.jobType,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      jobDescription: form.jobDescription.trim(),
      keyRequirements: form.keyRequirements.trim(),
      applicationDeadline: form.applicationDeadline,
    };

    console.log("Create New Job payload:", payload);
    onSubmit?.(payload);
    handleClose();
  };

  const inputBase =
    "w-full rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600";
  const fieldBorder = (field) =>
    errors[field] ? "border-red-400" : "border-gray-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="max-h-screen w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Create New Job
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job Title */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              placeholder="e.g., Software Engineer"
              className={`${inputBase} ${fieldBorder("jobTitle")}`}
            />
            {errors.jobTitle && (
              <p className="mt-1 text-xs text-red-500">{errors.jobTitle}</p>
            )}
          </div>

          {/* Location Detail */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Location Detail
            </label>
            <input
              type="text"
              value={form.locationDetail}
              onChange={(e) => update("locationDetail", e.target.value)}
              placeholder="e.g., Industrial Area, Jinja Rd"
              className={`${inputBase} ${fieldBorder("locationDetail")}`}
            />
          </div>

          {/* Division + Job Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Division <span className="text-red-500">*</span>
              </label>
              <select
                value={form.division}
                onChange={(e) => update("division", e.target.value)}
                className={`${inputBase} ${fieldBorder("division")} bg-white`}
              >
                <option value="">Select Division</option>
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
              {errors.division && (
                <p className="mt-1 text-xs text-red-500">{errors.division}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-800">
                Job Type
              </label>
              <select
                value={form.jobType}
                onChange={(e) => update("jobType", e.target.value)}
                className={`${inputBase} ${fieldBorder("jobType")} bg-white`}
              >
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Salary Range (UGX)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={form.salaryMin}
                onChange={(e) => update("salaryMin", e.target.value)}
                placeholder="Min"
                className={`${inputBase} ${fieldBorder("salaryMin")}`}
              />
              <span className="flex-shrink-0 text-gray-400">-</span>
              <input
                type="number"
                min="0"
                value={form.salaryMax}
                onChange={(e) => update("salaryMax", e.target.value)}
                placeholder="Max"
                className={`${inputBase} ${fieldBorder("salaryMax")}`}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={form.jobDescription}
              onChange={(e) => update("jobDescription", e.target.value)}
              placeholder="Describe the role, responsibilities, and key expectations..."
              className={`${inputBase} ${fieldBorder("jobDescription")} resize-y`}
            />
            {errors.jobDescription && (
              <p className="mt-1 text-xs text-red-500">{errors.jobDescription}</p>
            )}
          </div>

          {/* Key Requirements */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Key Requirements
            </label>
            <textarea
              rows={3}
              value={form.keyRequirements}
              onChange={(e) => update("keyRequirements", e.target.value)}
              placeholder="List required skills, experience, education..."
              className={`${inputBase} ${fieldBorder("keyRequirements")} resize-y`}
            />
          </div>

          {/* Application Deadline */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">
              Application Deadline
            </label>
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => update("applicationDeadline", e.target.value)}
              className={`${inputBase} ${fieldBorder("applicationDeadline")}`}
            />
            {errors.applicationDeadline && (
              <p className="mt-1 text-xs text-red-500">
                {errors.applicationDeadline}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Setting a deadline is required to publish the job.
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}