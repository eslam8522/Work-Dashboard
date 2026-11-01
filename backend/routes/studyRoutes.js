import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAvailableStudies,
  createStudy,
  reserveStudy,
  completeStudy,
  cancelStudy,
  getMySubmissions,
  getPendingSubmissions,
  reviewSubmission,
} from '../controllers/studyController.js';

const router = express.Router();

router.use(protect);

// Workers
router.get('/', authorize('WORKER'), getAvailableStudies);
router.get('/mine', authorize('WORKER'), getMySubmissions);
router.post('/:studyId/reserve', authorize('WORKER'), reserveStudy);
router.post('/:studyId/complete', authorize('WORKER'), completeStudy);
router.post('/:studyId/cancel', authorize('WORKER'), cancelStudy);

// Admins
router.post('/create', authorize('ADMIN'), createStudy);
router.get('/pending', authorize('ADMIN'), getPendingSubmissions);
router.patch('/:id/review', authorize('ADMIN'), reviewSubmission);

export default router;
