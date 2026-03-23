const Module = require('../models/Module');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories
const uploadDirs = {
  videos: 'uploads/module-videos',
  markdown: 'uploads/module-markdown',
  images: 'uploads/module-images'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, uploadDirs.videos);
    } else if (file.fieldname === 'markdown') {
      cb(null, uploadDirs.markdown);
    } else if (file.fieldname === 'images') {
      cb(null, uploadDirs.images);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed'), false);
    }
  } else if (file.fieldname === 'markdown') {
    if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only .md files allowed'), false);
    }
  } else if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB for videos
  }
});

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    module.videoUrl = `/uploads/module-videos/${req.file.filename}`;
    await module.save();

    res.json({
      message: 'Video uploaded successfully',
      videoUrl: module.videoUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
};

// Upload markdown
exports.uploadMarkdown = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No markdown file uploaded' });
    }

    // Read markdown file content
    const markdownPath = path.join(uploadDirs.markdown, req.file.filename);
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');

    module.markdownContent = markdownContent;
    await module.save();

    // Delete the uploaded file after reading
    fs.unlinkSync(markdownPath);

    res.json({
      message: 'Markdown uploaded successfully',
      contentLength: markdownContent.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload markdown', error: error.message });
  }
};

// Upload images for markdown
exports.uploadImages = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files uploaded' });
    }

    const images = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/module-images/${file.filename}`
    }));

    module.markdownImages = [...(module.markdownImages || []), ...images];
    await module.save();

    res.json({
      message: 'Images uploaded successfully',
      images: images
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
};

// Get module content (for authorized users)
exports.getModuleContent = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const module = await Module.findById(moduleId)
      .select('title videoUrl markdownContent markdownImages');
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch content', error: error.message });
  }
};

exports.uploadMiddleware = upload;
