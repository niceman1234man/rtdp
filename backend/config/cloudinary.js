import cloudinaryPkg from 'cloudinary';
import multer from 'multer';
import multerCloudinary from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// configure v2 client for direct use in controllers
const cloudinaryV2 = cloudinaryPkg.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For multer-storage-cloudinary we must pass the whole package (so it can access `.v2`)
const CloudinaryStorage = multerCloudinary.default || multerCloudinary;

const storage = CloudinaryStorage({
  // pass the package, not the v2 client
  cloudinary: cloudinaryPkg,
  folder: 'rtdp-documents',
  resource_type: 'raw', // for docs
  allowed_formats: ['pdf', 'doc', 'docx'],
  public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export { cloudinaryV2 as cloudinary, upload };
