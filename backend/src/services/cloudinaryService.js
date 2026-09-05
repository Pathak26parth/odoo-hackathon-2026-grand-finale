const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryService {
  /**
   * Check if Cloudinary credentials are fully provided
   */
  isConfigured() {
    return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
  }

  /**
   * Check if a given string is a base64 encoded data URI
   * @param {string} str
   * @returns {boolean}
   */
  isBase64Image(str) {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('data:image/') || str.startsWith('data:application/octet-stream;base64');
  }

  /**
   * Upload base64 image data or remote image URL to Cloudinary
   * @param {string} source - Base64 data URI (e.g. data:image/png;base64,...) or remote URL
   * @param {string} folder - Cloudinary folder prefix (e.g. 'peoplepay360/employees')
   * @param {string} [publicId] - Optional specific public ID
   * @returns {Promise<string>} Secure HTTPS URL of the uploaded image
   */
  async uploadImage(source, folder = 'peoplepay360/employees', publicId = null) {
    if (!source) return null;

    // If it's already an active Cloudinary URL or remote HTTPS URL and not a base64 string, keep it
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
      return source;
    }

    if (!this.isConfigured()) {
      console.warn('[CloudinaryService] Credentials missing in environment, skipping upload.');
      return source;
    }

    try {
      const options = {
        folder,
        resource_type: 'image',
        overwrite: true,
        invalidate: true
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(source, options);
      console.log(`[CloudinaryService] Uploaded successfully: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error('[CloudinaryService Error]:', error.message);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Upload binary buffer via upload_stream (e.g. from multer multipart request)
   * @param {Buffer} buffer - File buffer
   * @param {string} folder - Destination folder
   * @param {string} [publicId] - Optional public ID
   * @returns {Promise<string>} Secure HTTPS URL
   */
  async uploadBuffer(buffer, folder = 'peoplepay360/employees', publicId = null) {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured.');
    }

    return new Promise((resolve, reject) => {
      const options = {
        folder,
        resource_type: 'image',
        overwrite: true,
        invalidate: true
      };
      if (publicId) options.public_id = publicId;

      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          console.error('[Cloudinary Buffer Upload Error]:', error.message);
          return reject(error);
        }
        resolve(result.secure_url);
      });

      stream.end(buffer);
    });
  }

  /**
   * Delete an image from Cloudinary by public ID
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    if (!this.isConfigured() || !publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`[CloudinaryService] Deleted asset: ${publicId}`);
    } catch (error) {
      console.warn(`[CloudinaryService] Failed to delete asset ${publicId}:`, error.message);
    }
  }
}

module.exports = new CloudinaryService();
