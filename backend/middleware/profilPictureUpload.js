import multer from 'multer'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },   // bemenet: max 5 MB
})

// Wrapper, hogy a multer hibái szép választ kapjanak
export function avatarUpload(req, res, next) {
  upload.single('kep')(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      const uzenet = err.code === 'LIMIT_FILE_SIZE'
        ? 'A fájl túl nagy (max. 5 MB)'
        : 'Hibás fájlfeltöltés'
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: uzenet })
    }
    next(err)
  })
}