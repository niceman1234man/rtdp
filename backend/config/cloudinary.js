// backend/config/cloudinary.js
import cloudinaryPkg from 'cloudinary'
import multer from 'multer'
import multerStoragePkg from 'multer-storage-cloudinary'
const { CloudinaryStorage } = multerStoragePkg

import dotenv from 'dotenv'

dotenv.config();
const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage settings — support CommonJS and different export shapes
const StoragePkg = multerStoragePkg;
// The package may export the constructor/class via different shapes:
// - module.exports = function(opts) { return new CloudinaryStorage(opts) }  (common in this package)
// - module.exports = CloudinaryStorage class (less common)
// - exports.CloudinaryStorage = CloudinaryStorage

const CloudinaryStorageCtor = StoragePkg && (StoragePkg.CloudinaryStorage || (StoragePkg.default && (StoragePkg.default.CloudinaryStorage || StoragePkg.default)) || StoragePkg || null);

const storageParams = async (req, file) => {
  let resourceType = 'image'; // default
  if (file.mimetype && file.mimetype.startsWith('video/')) resourceType = 'video';
  if (file.mimetype === 'application/pdf') resourceType = 'raw';
  return {
    folder: 'rtdp',
    resource_type: resourceType,
    allowed_formats: ['docx', 'doc', 'pdf'],
  };
};

let storage;
if (typeof CloudinaryStorageCtor === 'function') {
  // If it's a constructor/class, try using 'new'. If it's a factory function (module returns a function that returns an instance), call it.
  try {
    storage = new CloudinaryStorageCtor({ cloudinary, params: storageParams });
  } catch (e) {
    try {
      storage = CloudinaryStorageCtor({ cloudinary, params: storageParams });
    } catch (err) {
      throw new Error('Could not initialize Cloudinary storage: ' + (err && err.message));
    }
  }
} else {
  throw new Error('Cloudinary storage constructor/function not found in multer-storage-cloudinary package');
}

const upload = multer({ storage });

export { cloudinary, upload };
