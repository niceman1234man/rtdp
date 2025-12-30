// backend/config/cloudinary.js
import cloudinaryPkg from 'cloudinary'
import multer from 'multer'
import cloudinaryStoragePkg from 'multer-storage-cloudinary'
import dotenv from 'dotenv'

dotenv.config()

const cloudinary = cloudinaryPkg.v2
const { cloudinaryStorage } = cloudinaryStoragePkg

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ✅ FUNCTION-BASED STORAGE (NEW API)
const storage = cloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rtdp-documents',
    resource_type: 'raw', // ✅ documents only
    allowed_formats: ['pdf', 'doc', 'docx'],
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
  },
})

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
