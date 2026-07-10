const { success } = require('../../utils/apiResponse');
const jobService = require('./job.service');

const createJob = async (req, res, next) => {
  try {
    const data = await jobService.createJob(req.user.sub, req.body);
    success(res, data, 'Job created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const data = await jobService.updateJob(req.params.id, req.user.sub, req.body);
    success(res, data, 'Job updated successfully');
  } catch (error) {
    next(error);
  }
};

const publishJob = async (req, res, next) => {
  try {
    const data = await jobService.publishJob(req.params.id, req.user.sub);
    success(res, data, 'Job published successfully');
  } catch (error) {
    next(error);
  }
};

const closeJob = async (req, res, next) => {
  try {
    const data = await jobService.closeJob(req.params.id, req.user.sub);
    success(res, data, 'Job closed successfully');
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const data = await jobService.softDeleteJob(req.params.id, req.user.sub, isAdmin);
    success(res, data, 'Job archived successfully');
  } catch (error) {
    next(error);
  }
};

const listJobs = async (req, res, next) => {
  try {
    const result = await jobService.listJobs(req.query);
    success(res, result.data, 'Job listings retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getJob = async (req, res, next) => {
  try {
    const data = await jobService.getJob(req.params.id);
    success(res, data, 'Job retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const myListings = async (req, res, next) => {
  try {
    const data = await jobService.myListings(req.user.sub);
    success(res, data, 'Listings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const adminAll = async (req, res, next) => {
  try {
    const result = await jobService.adminAllJobs(req.query);
    success(res, result.data, 'All jobs retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  deleteJob,
  listJobs,
  getJob,
  myListings,
  adminAll
};
