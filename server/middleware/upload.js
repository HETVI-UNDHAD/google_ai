const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
};

const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.xlsx', '.xls'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
};

exports.uploadImage = multer({ storage, fileFilter: imageFilter });
exports.uploadFile  = multer({ storage, fileFilter });
