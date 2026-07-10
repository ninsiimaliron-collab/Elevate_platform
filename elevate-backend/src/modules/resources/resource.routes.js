const express = require('express');

const controller = require('./resource.controller');
const { verifyAccessToken } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { runValidation } = require('../../middleware/validate.middleware');
const { createResourceValidation, updateResourceValidation, listResourceValidation } = require('./resource.validation');

const router = express.Router();

router.get('/', listResourceValidation, runValidation, controller.listResources);
router.get('/my/bookmarks', verifyAccessToken, authorize('youth'), controller.myBookmarks);
router.post('/:id/bookmark', verifyAccessToken, authorize('youth'), controller.addBookmark);
router.delete('/:id/bookmark', verifyAccessToken, authorize('youth'), controller.removeBookmark);

router.get('/:id', controller.getResource);

router.post('/', verifyAccessToken, authorize('admin'), createResourceValidation, runValidation, controller.createResource);
router.put('/:id', verifyAccessToken, authorize('admin'), updateResourceValidation, runValidation, controller.updateResource);
router.delete('/:id', verifyAccessToken, authorize('admin'), controller.deleteResource);
router.patch('/:id/publish', verifyAccessToken, authorize('admin'), controller.publishResource);

module.exports = router;
