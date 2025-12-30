// backend/config/cloudinary.js
import cloudinaryPkg from 'cloudinary'
import multer from 'multer'
import cloudinaryStoragePkg from 'multer-storage-cloudinary'
import dotenv from 'dotenv'

dotenv.config()

const cloudinary = cloudinaryPkg.v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Initialize storage in a robust way to support different export shapes from multer-storage-cloudinary
const StoragePkg = cloudinaryStoragePkg;
const storageFactory = StoragePkg && (StoragePkg.cloudinaryStorage || (StoragePkg.default && StoragePkg.default.cloudinaryStorage) || StoragePkg.default || StoragePkg || null);

const storageParams = {
  folder: 'rtdp-documents',
  resource_type: 'raw', // documents only
  allowed_formats: ['pdf', 'doc', 'docx'],
  public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
};

let storage;
if (typeof storageFactory === 'function') {
  // Some versions export a factory function that RETURNS an instance when called
  // others export a constructor/class that needs 'new'. Try both.
  try {
    storage = storageFactory({ cloudinary, params: storageParams });
  } catch (e) {
    try {
      storage = new storageFactory({ cloudinary, params: storageParams });
    } catch (err) {
      throw new Error('Could not initialize Cloudinary storage: ' + (err && err.message));
    }
  }
} else {
  throw new Error('Cloudinary storage initializer not found in multer-storage-cloudinary package');
}

// 🔐 File validation (extra safety)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only PDF, DOC, DOCX files are allowed'), false)
  } else {
    cb(null, true)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (Render safe)
})

export { cloudinary, upload }
