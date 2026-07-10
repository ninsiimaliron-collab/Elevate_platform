const { success } = require('../../utils/apiResponse');
const userService = require('./user.service');

const getMe = async (req, res, next) => {
  try {
    const data = await userService.getMe(req.user.sub);
    success(res, data, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateYouthProfile = async (req, res, next) => {
  try {
    await userService.ensureUserRole(req.user.sub, 'youth');
    const data = await userService.updateYouthProfile(req.user.sub, req.body);
    success(res, data, 'Youth profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadCv = async (req, res, next) => {
  try {
    await userService.ensureUserRole(req.user.sub, 'youth');
    const data = await userService.uploadYouthCv(req.user.sub, req.file);
    success(res, data, 'CV uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const uploadPortfolio = async (req, res, next) => {
  try {
    await userService.ensureUserRole(req.user.sub, 'youth');
    const data = await userService.uploadYouthPortfolio(req.user.sub, req.file);
    success(res, data, 'Portfolio uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const updateEmployerProfile = async (req, res, next) => {
  try {
    await userService.ensureUserRole(req.user.sub, 'employer');
    const data = await userService.updateEmployerProfile(req.user.sub, req.body);
    success(res, data, 'Employer profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    await userService.ensureUserRole(req.user.sub, 'employer');
    const data = await userService.uploadEmployerLogo(req.user.sub, req.file);
    success(res, data, 'Logo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const getPublicYouthProfile = async (req, res, next) => {
  try {
    const data = await userService.getPublicYouthProfile(req.params.id);
    success(res, data, 'Youth profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await userService.listUsers(req.query);
    success(res, result.data, 'Users retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const setUserStatus = async (req, res, next) => {
  try {
    const data = await userService.setUserStatus(req.params.id, req.body.is_active);
    success(res, data, 'User status updated successfully');
  } catch (error) {
    next(error);
  }
};

const verifyEmployer = async (req, res, next) => {
  try {
    const data = await userService.verifyEmployer(req.params.id, req.body.registration_status);
    success(res, data, 'Employer verification updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateYouthProfile,
  uploadCv,
  uploadPortfolio,
  updateEmployerProfile,
  uploadLogo,
  getPublicYouthProfile,
  listUsers,
  setUserStatus,
  verifyEmployer
};
