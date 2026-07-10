const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_CV_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const cvFileFilter = (_req, file, cb) => {
  if (!file || !file.originalname) {
    cb(new Error('Invalid upload request'));
    return;
  }
  
  if (!ALLOWED_CV_TYPES.includes(file.mimetype)) {
    cb(new Error('Only PDF and Word documents are allowed for CV'));
    return;
  }
  
  cb(null, true);
};

const imageFileFilter = (_req, file, cb) => {
  if (!file || !file.originalname) {
    cb(new Error('Invalid upload request'));
    return;
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    return;
  }
  
  cb(null, true);
};

const cvUpload = multer({ storage, fileFilter: cvFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const imageUpload = multer({ storage, fileFilter: imageFileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

module.exports = {
  cvUpload,
  imageUpload
};
