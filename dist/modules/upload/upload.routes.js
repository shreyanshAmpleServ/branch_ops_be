import { Router } from 'express';
import { auth } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
const router = Router();
router.post('/file', auth, upload.single('file'), (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({
                status: 'fail',
                message: 'No file was uploaded.',
            });
            return;
        }
        res.status(201).json({
            status: 'success',
            data: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
