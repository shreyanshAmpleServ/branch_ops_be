import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';

const router = Router();
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'fail',
        message: 'No file was uploaded.',
      });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      status: 'success',
      url: fileUrl,
      path: fileUrl,
      file: fileUrl,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: fileUrl,
        url: fileUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

router.post('/', auth, upload.single('file'), handleUpload);
router.post('/file', auth, upload.single('file'), handleUpload);

export default router;
