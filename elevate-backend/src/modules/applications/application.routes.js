const express = require('express');

const controller = require('./application.controller');
const { verifyAccessToken } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { runValidation } = require('../../middleware/validate.middleware');
const { applyValidation, listMyValidation, updateStatusValidation } = require('./application.validation');

const router = express.Router();

router.use(verifyAccessToken);

router.post('/jobs/:jobId/apply', authorize('youth'), applyValidation, runValidation, controller.apply);
router.get('/my', authorize('youth'), listMyValidation, runValidation, controller.myApplications);
router.get('/jobs/:jobId/applicants', authorize('employer'), controller.jobApplicants);
router.patch('/:id/status', authorize('employer'), updateStatusValidation, runValidation, controller.updateStatus);
router.patch('/:id/withdraw', authorize('youth'), controller.withdraw);
router.get('/admin/all', authorize('admin'), controller.adminAll);

module.exports = router;
