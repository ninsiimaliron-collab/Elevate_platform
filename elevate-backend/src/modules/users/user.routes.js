const express = require('express');

const controller = require('./user.controller');
const { verifyAccessToken } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { runValidation } = require('../../middleware/validate.middleware');
const { cvUpload, imageUpload } = require('../../config/multer');
const {
  updateYouthProfileValidation,
  updateEmployerProfileValidation,
  userListValidation,
  userIdValidation,
  setStatusValidation,
  verifyEmployerValidation
} = require('./user.validation');

const router = express.Router();

router.use(verifyAccessToken);

router.get('/me', controller.getMe);
router.put('/me/youth-profile', authorize('youth'), updateYouthProfileValidation, runValidation, controller.updateYouthProfile);
router.post('/me/upload-cv', authorize('youth'), cvUpload.single('cv'), controller.uploadCv);
router.post('/me/upload-portfolio', authorize('youth'), imageUpload.single('portfolio'), controller.uploadPortfolio);
router.put(
  '/me/employer-profile',
  authorize('employer'),
  updateEmployerProfileValidation,
  runValidation,
  controller.updateEmployerProfile
);
router.post('/me/upload-logo', authorize('employer'), imageUpload.single('logo'), controller.uploadLogo);

router.get('/youth/:id', authorize('employer', 'admin'), userIdValidation, runValidation, controller.getPublicYouthProfile);

router.get('/', authorize('admin'), userListValidation, runValidation, controller.listUsers);
router.patch('/:id/status', authorize('admin'), setStatusValidation, runValidation, controller.setUserStatus);
router.patch('/employers/:id/verify', authorize('admin'), verifyEmployerValidation, runValidation, controller.verifyEmployer);

module.exports = router;
