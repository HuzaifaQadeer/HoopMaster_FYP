const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} resourceType - 'image' or 'video'
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<Object>} - Cloudinary response object
 */
const uploadToCloudinary = async (filePath, resourceType = 'auto', folder = '') => {
  try {
    // Upload options
    const options = {
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: true,
    };
    
    // Add folder if provided
    if (folder) {
      options.folder = folder;
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, options);
    
    // Return the result
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} - Cloudinary response object
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    // Delete options
    const options = {
      resource_type: resourceType
    };
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, options);
    
    // Return the result
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
}; 