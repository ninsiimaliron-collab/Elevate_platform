const express = require('express');

const controller = require('./job.controller');
const { verifyAccessToken } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { runValidation } = require('../../middleware/validate.middleware');
const { createJobValidation, updateJobValidation, listJobsValidation } = require('./job.validation');

const router = express.Router();

router.get('/my/listings', verifyAccessToken, authorize('employer'), controller.myListings);
router.get('/admin/all', verifyAccessToken, authorize('admin'), controller.adminAll);

router.get('/', listJobsValidation, runValidation, controller.listJobs);
router.get('/:id', controller.getJob);

router.post('/', verifyAccessToken, authorize('employer'), createJobValidation, runValidation, controller.createJob);
router.put('/:id', verifyAccessToken, authorize('employer'), updateJobValidation, runValidation, controller.updateJob);
router.patch('/:id/publish', verifyAccessToken, authorize('employer'), controller.publishJob);
router.patch('/:id/close', verifyAccessToken, authorize('employer'), controller.closeJob);
router.delete('/:id', verifyAccessToken, authorize('employer', 'admin'), controller.deleteJob);

module.exports = router;
