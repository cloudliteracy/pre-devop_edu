const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');
const contentUploadAuth = require('../middleware/contentUploadAuth');

router.post(
  '/:moduleId/video',
  auth,
  contentUploadAuth,
  contentController.uploadMiddleware.single('video'),
  contentController.uploadVideo
);

router.post(
  '/:moduleId/markdown',
  auth,
  contentUploadAuth,
  contentController.uploadMiddleware.single('markdown'),
  contentController.uploadMarkdown
);

router.post(
  '/:moduleId/images',
  auth,
  contentUploadAuth,
  contentController.uploadMiddleware.array('images', 10),
  contentController.uploadImages
);

router.get('/:moduleId', auth, contentController.getModuleContent);

module.exports = router;
