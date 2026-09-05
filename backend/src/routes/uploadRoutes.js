const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinaryService = require('../services/cloudinaryService');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/response');

// Memory storage for multer file buffers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
    }
  }
});

/**
 * Generic Image Upload Endpoint (supports both JSON Base64 and Multipart FormData)
 * POST /api/upload/image
 */
router.post('/image', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    let imageUrl = null;

    if (req.file) {
      // Multipart upload
      imageUrl = await cloudinaryService.uploadBuffer(
        req.file.buffer,
        req.body.folder || 'peoplepay360/uploads'
      );
    } else if (req.body && req.body.image) {
      // JSON base64 upload
      imageUrl = await cloudinaryService.uploadImage(
        req.body.image,
        req.body.folder || 'peoplepay360/uploads'
      );
    } else {
      return sendError(res, 'No image file or base64 image data provided.', 400);
    }

    return sendSuccess(res, 'Image uploaded successfully to Cloudinary', {
      url: imageUrl,
      profilePhotoUrl: imageUrl
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload & immediately update Employee Profile Photo
 * POST /api/upload/employee-photo/:id
 */
router.post('/employee-photo/:id', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const { id } = req.params;
    let imageUrl = null;

    if (req.file) {
      imageUrl = await cloudinaryService.uploadBuffer(
        req.file.buffer,
        'peoplepay360/employees',
        `emp_${id}_${Date.now()}`
      );
    } else if (req.body && (req.body.image || req.body.photo || req.body.profilePhotoUrl || req.body.avatar)) {
      const rawImage = req.body.image || req.body.photo || req.body.profilePhotoUrl || req.body.avatar;
      imageUrl = await cloudinaryService.uploadImage(
        rawImage,
        'peoplepay360/employees',
        `emp_${id}_${Date.now()}`
      );
    } else {
      return sendError(res, 'No image data provided for employee photo.', 400);
    }

    // Update database
    await query(
      'UPDATE employees SET profile_photo_url = ?, updated_at = NOW() WHERE id = ? OR employee_code = ?',
      [imageUrl, id, id]
    );

    return sendSuccess(res, 'Employee photo updated successfully in Cloudinary', {
      profilePhotoUrl: imageUrl,
      avatar: imageUrl
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
