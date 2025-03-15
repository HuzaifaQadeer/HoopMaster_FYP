const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure Server/posts directory exists for post media
const serverPostsDir = path.join(__dirname, '../../Server/posts');
if (!fs.existsSync(serverPostsDir)) {
  fs.mkdirSync(serverPostsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subfolder based on file type
    let folder = 'other';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }
    
    const destPath = path.join(serverPostsDir, folder);
    
    // Create subfolder if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-original-name
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniquePrefix + extension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

// Create the multer instance with increased limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Increase to 100MB file size limit
    fieldSize: 100 * 1024 * 1024, // Increase field size limit also
  }
});

module.exports = upload; 