// backend/config/cloudinary.js
import cloudinaryPkg from 'cloudinary'
import multer from 'multer'
import multerStorageCloudinary from 'multer-storage-cloudinary'
import dotenv from 'dotenv'

dotenv.config()

const { CloudinaryStorage } = multerStorageCloudinary
const cloudinary = cloudinaryPkg.v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'rtdp-documents',
    resource_type: 'raw', // ✅ documents only
    public_id: `${Date.now()}-${file.originalname}`,
  }),
})

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

export { cloudinary, upload }
