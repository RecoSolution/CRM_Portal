import multer from 'multer'

const storage = multer.memoryStorage()

// ── Image uploads (business card photos) ──────────────────
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
})

// ── Audio uploads (voice notes) ────────────────────────────
const audioFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true)
  } else {
    cb(new Error('Only audio files are allowed'), false)
  }
}

export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
})

export default upload