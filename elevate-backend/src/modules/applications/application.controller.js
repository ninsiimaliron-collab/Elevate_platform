const { success } = require('../../utils/apiResponse');
const service = require('./application.service');

const apply = async (req, res, next) => {
  try {
    const data = await service.apply(req.params.jobId, req.user.sub, req.body.cover_letter);
    success(res, data, 'Application submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

const myApplications = async (req, res, next) => {
  try {
    const result = await service.myApplications(req.user.sub, req.query);
    success(res, result.data, 'Applications retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const jobApplicants = async (req, res, next) => {
  try {
    const data = await service.jobApplicants(req.params.jobId, req.user.sub);
    success(res, data, 'Applicants retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await service.updateApplicationStatus(req.params.id, req.user.sub, req.body.status);
    success(res, data, 'Application status updated successfully');
  } catch (error) {
    next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    const data = await service.withdraw(req.params.id, req.user.sub);
    success(res, data, 'Application withdrawn successfully');
  } catch (error) {
    next(error);
  }
};

const adminAll = async (req, res, next) => {
  try {
    const result = await service.adminAll(req.query);
    success(res, result.data, 'All applications retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  apply,
  myApplications,
  jobApplicants,
  updateStatus,
  withdraw,
  adminAll
};
